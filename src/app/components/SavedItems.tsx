import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Heart, Trash2 } from "lucide-react";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { resolveListingImageUrl } from "@/app/lib/storage";
import type { ListingWithSeller } from "@/app/lib/types";

export function SavedItems() {
  const { profile } = useAuth();
  const [items, setItems] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    supabase
      .from("saved_items")
      .select("created_at, listing:listings(*, seller:profiles(*))")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        const listings = (data ?? [])
          .map((row) => row.listing as unknown as ListingWithSeller)
          .filter(Boolean);
        setItems(listings);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this item from your saved items?")) return;
    if (!profile) return;

    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase.from("saved_items").delete().eq("user_id", profile.id).eq("listing_id", id);
    if (error) {
      setItems(previous);
      alert("Couldn't remove this item. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Items</h1>
        <p className="text-gray-600">Items you've liked and saved for later</p>
      </div>

      {/* Saved Items Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group"
            >
              <div className="relative">
                <Link to={`/item/${item.id}`}>
                  <img
                    src={resolveListingImageUrl(item.image_url)}
                    alt={item.title}
                    className="w-full h-48 object-cover bg-gray-100"
                  />
                </Link>
                <Badge className="absolute top-3 right-3 bg-white text-gray-900 hover:bg-white">
                  {item.condition}
                </Badge>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-3 left-3 p-2 bg-white rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
              <CardContent className="p-4">
                <Link to={`/item/${item.id}`}>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] hover:text-[#0A1E3C]">
                    {item.title}
                  </h3>
                </Link>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-[#0A1E3C]">${item.price}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 bg-[#0A1E3C] rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                      {item.seller.full_name.charAt(0)}
                    </div>
                    <span className="truncate max-w-[100px]">{item.seller.full_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart size={12} className="fill-red-500 text-red-500" /> {item.likes_count}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Heart size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved items yet</h3>
          <p className="text-gray-600 mb-6">Browse items and click the heart icon to save them here</p>
          <Link to="/browse">
            <Button className="bg-[#0A1E3C] hover:bg-[#050F1E]">Browse Items</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
