import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { MessageCircle, Send, MapPin, ShieldCheck } from "lucide-react";
import { MOCK_MESSAGES, MEETUP_LOCATIONS } from "../data/mockData";
import { formatDistanceToNow } from "date-fns";

export function Messages() {
  const [selectedMessage, setSelectedMessage] = useState(MOCK_MESSAGES[0]);
  const [messageInput, setMessageInput] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      // Handle send message
      alert(`Sent: ${messageInput}`);
      setMessageInput("");
    }
  };

  // Mock conversation messages
  const conversationMessages = [
    {
      id: "1",
      sender: selectedMessage.otherUser,
      text: "Hi! Is this item still available?",
      timestamp: "2026-02-11T14:00:00",
      isMe: false,
    },
    {
      id: "2",
      sender: { name: "You", id: "me" },
      text: "Yes, it's still available! Are you interested?",
      timestamp: "2026-02-11T14:05:00",
      isMe: true,
    },
    {
      id: "3",
      sender: selectedMessage.otherUser,
      text: "Great! Can we meet at the Student Center?",
      timestamp: "2026-02-12T10:15:00",
      isMe: false,
    },
    {
      id: "4",
      sender: { name: "You", id: "me" },
      text: "Yes, it's still available! When would you like to meet?",
      timestamp: "2026-02-12T10:30:00",
      isMe: true,
    },
  ];

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
            <ScrollArea className="h-[600px]">
              {MOCK_MESSAGES.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b ${
                    selectedMessage.id === msg.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 bg-[#0A1E3C] flex-shrink-0">
                      <AvatarFallback className="text-white">
                        {msg.otherUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm text-gray-900 truncate flex items-center gap-1">
                          {msg.otherUser.name}
                          {msg.otherUser.isVerified && (
                            <ShieldCheck size={14} className="text-[#0A1E3C]" />
                          )}
                        </h3>
                        {msg.unread && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1 truncate">
                        {msg.itemTitle}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {msg.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0 flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-[#0A1E3C]">
                    <AvatarFallback className="text-white">
                      {selectedMessage.otherUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-1">
                      {selectedMessage.otherUser.name}
                      {selectedMessage.otherUser.isVerified && (
                        <ShieldCheck size={16} className="text-[#0A1E3C]" />
                      )}
                    </h3>
                    <p className="text-xs text-gray-600">{selectedMessage.itemTitle}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {conversationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.isMe
                          ? "bg-[#0A1E3C] text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.isMe ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            {/* Safe Meetup Reminder */}
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
              <div className="flex items-start gap-2 text-xs">
                <MapPin size={14} className="text-[#0A1E3C] mt-0.5 flex-shrink-0" />
                <div className="text-gray-700">
                  <span className="font-semibold">Safe Meetup Locations:</span>{" "}
                  {MEETUP_LOCATIONS.slice(0, 2).map(loc => loc.name).join(", ")}
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
                <Button type="submit" className="bg-[#0A1E3C] hover:bg-[#050F1E]">
                  <Send size={18} />
                </Button>
              </div>
            </form>
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