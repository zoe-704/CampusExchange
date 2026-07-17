import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { MessageCircle, Send, MapPin, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { MEETUP_LOCATIONS, type MessageRow, type Profile } from "@/app/lib/types";

type MessageWithNames = MessageRow & {
  listing: { id: string; title: string } | null;
  sender: Profile;
  recipient: Profile;
};

type Thread = {
  key: string;
  listingId: string;
  listingTitle: string;
  otherUser: Profile;
  messages: MessageWithNames[];
  unreadCount: number;
};

function threadLastMessageTime(thread: Thread): number {
  if (thread.messages.length === 0) return Infinity; // brand-new threads sort first
  return Math.max(...thread.messages.map((m) => new Date(m.created_at).getTime()));
}

export function Messages() {
  const { profile, refreshUnreadCount } = useAuth();
  const [searchParams] = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("*, listing:listings(id, title), sender:profiles!messages_sender_id_fkey(*), recipient:profiles!messages_recipient_id_fkey(*)")
        .or(`sender_id.eq.${profile!.id},recipient_id.eq.${profile!.id}`)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      const byKey = new Map<string, Thread>();
      for (const row of (data ?? []) as unknown as MessageWithNames[]) {
        const otherUser = row.sender_id === profile!.id ? row.recipient : row.sender;
        const key = `${row.listing_id}:${otherUser.id}`;
        let thread = byKey.get(key);
        if (!thread) {
          thread = {
            key,
            listingId: row.listing_id,
            listingTitle: row.listing?.title ?? "Listing",
            otherUser,
            messages: [],
            unreadCount: 0,
          };
          byKey.set(key, thread);
        }
        thread.messages.push(row);
        if (row.recipient_id === profile!.id && !row.read) thread.unreadCount += 1;
      }

      let allThreads = Array.from(byKey.values());

      // Deep-link from ItemDetail's Contact Seller / Buy Now, which may
      // point at a listing/seller pair with no messages yet.
      const listingId = searchParams.get("listingId");
      const otherUserId = searchParams.get("otherUserId");
      let initialKey = allThreads[0]?.key ?? null;

      if (listingId && otherUserId && otherUserId !== profile!.id) {
        const key = `${listingId}:${otherUserId}`;
        if (byKey.has(key)) {
          initialKey = key;
        } else {
          const [{ data: listing }, { data: otherUser }] = await Promise.all([
            supabase.from("listings").select("id, title").eq("id", listingId).maybeSingle(),
            supabase.from("profiles").select("*").eq("id", otherUserId).maybeSingle(),
          ]);
          if (!cancelled && listing && otherUser) {
            allThreads = [
              { key, listingId, listingTitle: listing.title, otherUser, messages: [], unreadCount: 0 },
              ...allThreads,
            ];
            initialKey = key;
          }
        }
      }

      allThreads.sort((a, b) => threadLastMessageTime(b) - threadLastMessageTime(a));

      if (cancelled) return;
      setThreads(allThreads);
      setSelectedKey(initialKey);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const selectedThread = useMemo(() => threads.find((t) => t.key === selectedKey) ?? null, [threads, selectedKey]);

  useEffect(() => {
    if (!selectedThread || !profile || selectedThread.unreadCount === 0) return;
    const unreadIds = selectedThread.messages
      .filter((m) => m.recipient_id === profile.id && !m.read)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;

    supabase
      .from("messages")
      .update({ read: true })
      .in("id", unreadIds)
      .then(({ error }) => {
        if (error) return;
        setThreads((prev) =>
          prev.map((t) =>
            t.key !== selectedThread.key
              ? t
              : { ...t, unreadCount: 0, messages: t.messages.map((m) => (unreadIds.includes(m.id) ? { ...m, read: true } : m)) },
          ),
        );
        refreshUnreadCount();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?.key]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedThread || !profile) return;

    setSending(true);
    const body = messageInput.trim();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        listing_id: selectedThread.listingId,
        sender_id: profile.id,
        recipient_id: selectedThread.otherUser.id,
        body,
      })
      .select("*, listing:listings(id, title), sender:profiles!messages_sender_id_fkey(*), recipient:profiles!messages_recipient_id_fkey(*)")
      .single();
    setSending(false);

    if (error || !data) {
      alert("Couldn't send that message. Please try again.");
      return;
    }

    setMessageInput("");
    setThreads((prev) =>
      prev.map((t) =>
        t.key !== selectedThread.key ? t : { ...t, messages: [...t.messages, data as unknown as MessageWithNames] },
      ),
    );
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Chat with buyers and sellers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">Conversations</h2>
            </div>
            {threads.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                <MessageCircle className="mx-auto mb-3 text-gray-300" size={32} />
                No conversations yet.
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                {threads.map((thread) => {
                  const last = thread.messages[thread.messages.length - 1];
                  return (
                    <button
                      key={thread.key}
                      onClick={() => setSelectedKey(thread.key)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b ${
                        selectedKey === thread.key ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 bg-[#0A1E3C] flex-shrink-0">
                          <AvatarFallback className="text-white">
                            {thread.otherUser.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-sm text-gray-900 truncate flex items-center gap-1">
                              {thread.otherUser.full_name}
                              <ShieldCheck size={14} className="text-[#0A1E3C]" />
                            </h3>
                            {thread.unreadCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                          </div>
                          <p className="text-xs text-gray-600 mb-1 truncate">{thread.listingTitle}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {last ? last.body : "Say hello to start the conversation"}
                          </p>
                          {last && (
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(last.created_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0 flex flex-col h-[600px]">
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                Select a conversation to view messages
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 bg-[#0A1E3C]">
                        <AvatarFallback className="text-white">
                          {selectedThread.otherUser.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-1">
                          {selectedThread.otherUser.full_name}
                          <ShieldCheck size={16} className="text-[#0A1E3C]" />
                        </h3>
                        <p className="text-xs text-gray-600">{selectedThread.listingTitle}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedThread.messages.length === 0 && (
                      <p className="text-center text-sm text-gray-500 py-8">
                        No messages yet — send the first one below.
                      </p>
                    )}
                    {selectedThread.messages.map((msg) => {
                      const isMe = msg.sender_id === profile?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isMe ? "bg-[#0A1E3C] text-white" : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{msg.body}</p>
                            <p className={`text-xs mt-1 ${isMe ? "text-blue-100" : "text-gray-500"}`}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Safe Meetup Reminder */}
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin size={14} className="text-[#0A1E3C] mt-0.5 flex-shrink-0" />
                    <div className="text-gray-700">
                      <span className="font-semibold">Safe Meetup Locations:</span>{" "}
                      {MEETUP_LOCATIONS.slice(0, 2)
                        .map((loc) => loc.name)
                        .join(", ")}
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={sending} className="bg-[#0A1E3C] hover:bg-[#050F1E]">
                      <Send size={18} />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Safety Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
          <div className="text-sm">
            <p className="font-semibold text-gray-900 mb-1">Safety Guidelines</p>
            <ul className="text-gray-700 space-y-1 list-disc list-inside">
              <li>Only meet at verified campus locations during school hours</li>
              <li>Never share personal information like phone numbers or home addresses</li>
              <li>If something seems suspicious, report it immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
