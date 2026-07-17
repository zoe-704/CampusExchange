import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { ShieldCheck, Star, Package, CheckCircle, Mail, Calendar, Edit } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { resolveListingImageUrl } from "@/app/lib/storage";
import type { OrderRow, Profile as ProfileType } from "@/app/lib/types";

type OrderWithDetails = OrderRow & {
  listing: { id: string; title: string; image_url: string | null; price: number } | null;
  buyer: ProfileType;
  seller: ProfileType;
};

const STATUS_COLOR: Record<OrderRow["status"], string> = {
  completed: "bg-green-500",
  confirmed: "bg-blue-500",
  pending: "bg-yellow-500",
  cancelled: "bg-gray-400",
};

export function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
  }, [profile?.full_name]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    async function load() {
      const [listingsRes, ordersRes] = await Promise.all([
        supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", profile!.id)
          .eq("status", "available"),
        supabase
          .from("orders")
          .select(
            "*, listing:listings(id, title, image_url, price), buyer:profiles!orders_buyer_id_fkey(*), seller:profiles!orders_seller_id_fkey(*)",
          )
          .or(`buyer_id.eq.${profile!.id},seller_id.eq.${profile!.id}`)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;
      setActiveListingsCount(listingsRes.count ?? 0);
      setOrders((ordersRes.data as unknown as OrderWithDetails[] | null) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile || !fullName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", profile.id);
    setSaving(false);
    if (error) {
      alert("Couldn't save your profile. Please try again.");
      return;
    }
    await refreshProfile();
    setEditing(false);
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-center">
              <Avatar className="h-24 w-24 bg-[#0A1E3C] mx-auto mb-4">
                <AvatarFallback className="text-white text-3xl">{profile.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
                {profile.full_name}
                <ShieldCheck size={20} className="text-[#0A1E3C]" />
              </h2>
              <p className="text-sm text-gray-600 mb-4">{profile.email}</p>
              <Badge className="bg-green-500 mb-4">Verified Student</Badge>

              <Separator className="my-4" />

              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    Rating
                  </span>
                  <span className="font-semibold">{profile.rating.toFixed(1)}/5.0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    Sales Completed
                  </span>
                  <span className="font-semibold">{profile.completed_transactions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Package size={16} className="text-blue-500" />
                    Active Listings
                  </span>
                  <span className="font-semibold">{activeListingsCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    Member Since
                  </span>
                  <span className="font-semibold">{format(new Date(profile.created_at), "MMM yyyy")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail size={14} className="inline mr-1" />
                  Email Address
                </Label>
                <Input id="email" type="email" defaultValue={profile.email} disabled />
                <p className="text-xs text-gray-500">Verified @menloschool.org email</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Email notifications for new messages</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Alert me when someone likes my items</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Notify when items I want are posted</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Weekly summary of marketplace activity</span>
                  <input type="checkbox" className="rounded" />
                </label>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              {editing ? (
                <>
                  <Button
                    className="bg-[#0A1E3C] hover:bg-[#050F1E]"
                    onClick={handleSaveProfile}
                    disabled={saving || !fullName.trim()}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFullName(profile.full_name);
                      setEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button className="bg-[#0A1E3C] hover:bg-[#050F1E]" onClick={() => setEditing(true)}>
                  <Edit size={16} className="mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent transactions and orders</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading…</p>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => {
                const isBuyer = order.buyer_id === profile.id;
                const counterparty = isBuyer ? order.seller : order.buyer;
                return (
                  <div key={order.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={resolveListingImageUrl(order.listing?.image_url ?? null)}
                      alt={order.listing?.title ?? "Listing"}
                      className="w-16 h-16 object-cover rounded bg-gray-200"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{order.listing?.title ?? "Listing"}</h3>
                      <p className="text-sm text-gray-600">
                        {isBuyer ? "Seller" : "Buyer"}: {counterparty.full_name}
                      </p>
                      <p className="text-xs text-gray-500">{format(new Date(order.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#0A1E3C]">${order.listing?.price ?? "—"}</p>
                      <Badge className={STATUS_COLOR[order.status]}>{order.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          )}
        </CardContent>
      </Card>

      {/* Safety & Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="text-[#0A1E3C]" size={20} />
            Safety & Community Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Verified Student Status</h3>
              <p className="text-sm text-gray-600">
                Your @menloschool.org email is verified. This helps maintain a safe, trusted community.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Safe Meetups</h3>
              <p className="text-sm text-gray-600">
                Always meet at verified campus locations during school hours. Never share personal contact
                information.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Report Issues</h3>
              <p className="text-sm text-gray-600">
                See something suspicious? Use the flag button to report items or users that violate our guidelines.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Build Trust</h3>
              <p className="text-sm text-gray-600">
                Complete transactions on time, be honest about item conditions, and communicate clearly to build your
                reputation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
