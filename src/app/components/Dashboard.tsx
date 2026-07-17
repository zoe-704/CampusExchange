import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { TrendingUp, Clock, Heart, ShoppingBag, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { resolveListingImageUrl } from "@/app/lib/storage";
import type { ListingWithSeller } from "@/app/lib/types";

export function Dashboard() {
  const { profile } = useAuth();
  const [recentItems, setRecentItems] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ activeListings: 0, pendingOrders: 0, savedItems: 0 });

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    async function load() {
      const [listingsRes, activeListingsRes, pendingOrdersRes, savedItemsRes] = await Promise.all([
        supabase
          .from("listings")
          .select("*, seller:profiles(*)")
          .eq("status", "available")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", profile!.id)
          .eq("status", "available"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("buyer_id", profile!.id)
          .eq("status", "pending"),
        supabase.from("saved_items").select("listing_id", { count: "exact", head: true }).eq("user_id", profile!.id),
      ]);

      if (cancelled) return;
      setRecentItems((listingsRes.data as ListingWithSeller[] | null) ?? []);
      setCounts({
        activeListings: activeListingsRes.count ?? 0,
        pendingOrders: pendingOrdersRes.count ?? 0,
        savedItems: savedItemsRes.count ?? 0,
      });
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (!profile) return null;

  const stats = [
    { label: "Active Listings", value: counts.activeListings, icon: ShoppingBag, color: "text-blue-600" },
    { label: "Pending Orders", value: counts.pendingOrders, icon: Clock, color: "text-yellow-600" },
    { label: "Completed Sales", value: profile.completed_transactions, icon: CheckCircle, color: "text-green-600" },
    { label: "Saved Items", value: counts.savedItems, icon: Heart, color: "text-red-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#0A1E3C] to-[#163A5F] rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {profile.full_name}! 👋</h1>
            <p className="text-gray-200">
              Find great deals on textbooks, supplies, and more from fellow Menlo School students.
            </p>
          </div>
          <Link to="/create">
            <Button className="bg-[#D4AF37] text-[#0A1E3C] hover:bg-[#E8D5A1] font-semibold">Post New Item</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="text-[#0A1E3C]" size={20} />
                  Trending Items
                </CardTitle>
                <CardDescription>Popular listings right now</CardDescription>
              </div>
              <Link to="/browse">
                <Button variant="ghost" size="sm" className="text-[#0A1E3C]">
                  View All <ArrowRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading && <p className="text-sm text-gray-500 text-center py-8">Loading listings…</p>}
              {!loading && recentItems.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No listings yet.</p>
              )}
              {recentItems.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={`/item/${item.id}`}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={resolveListingImageUrl(item.image_url)}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <span className="text-xs text-gray-500">{item.views_count} views</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#0A1E3C]">${item.price}</p>
                    <p className="text-xs text-gray-500">{item.condition}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/create">
              <Button className="w-full justify-start bg-[#0A1E3C] hover:bg-[#050F1E]">Post New Item</Button>
            </Link>
            <Link to="/browse">
              <Button variant="outline" className="w-full justify-start">
                Browse Marketplace
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="outline" className="w-full justify-start">
                View Messages
              </Button>
            </Link>
            <Link to="/my-listings">
              <Button variant="outline" className="w-full justify-start">
                Manage Listings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Listings Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Listings</h2>
            <p className="text-gray-600">Latest items from your classmates</p>
          </div>
          <Link to="/browse">
            <Button variant="outline" className="text-[#0A1E3C] border-[#0A1E3C]">
              Browse All
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentItems.map((item) => (
            <Link key={item.id} to={`/item/${item.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={resolveListingImageUrl(item.image_url)}
                    alt={item.title}
                    className="w-full h-48 object-cover bg-gray-100"
                  />
                  <Badge className="absolute top-3 right-3 bg-white text-gray-900">{item.condition}</Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">{item.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#0A1E3C]">${item.price}</span>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart size={14} /> {item.likes_count}
                    </span>
                    <span>{item.seller.full_name}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
