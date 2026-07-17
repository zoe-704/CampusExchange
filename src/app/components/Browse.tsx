import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Heart } from "lucide-react";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { resolveListingImageUrl } from "@/app/lib/storage";
import { ITEM_CATEGORIES, type ListingWithSeller } from "@/app/lib/types";

export function Browse() {
  const { profile } = useAuth();
  const [items, setItems] = useState<ListingWithSeller[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    async function load() {
      const [listingsRes, savedRes] = await Promise.all([
        supabase
          .from("listings")
          .select("*, seller:profiles(*)")
          .eq("status", "available")
          .order("created_at", { ascending: false }),
        supabase.from("saved_items").select("listing_id").eq("user_id", profile!.id),
      ]);
      if (cancelled) return;
      setItems((listingsRes.data as ListingWithSeller[] | null) ?? []);
      setSavedIds(new Set((savedRes.data ?? []).map((row) => row.listing_id)));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const toggleSave = async (e: React.MouseEvent, listingId: string) => {
    e.preventDefault();
    if (!profile) return;
    const isSaved = savedIds.has(listingId);

    const next = new Set(savedIds);
    isSaved ? next.delete(listingId) : next.add(listingId);
    setSavedIds(next);
    setItems((prev) =>
      prev.map((item) =>
        item.id === listingId
          ? { ...item, likes_count: item.likes_count + (isSaved ? -1 : 1) }
          : item,
      ),
    );

    const { error } = isSaved
      ? await supabase.from("saved_items").delete().eq("user_id", profile.id).eq("listing_id", listingId)
      : await supabase.from("saved_items").insert({ user_id: profile.id, listing_id: listingId });

    if (error) {
      setSavedIds(savedIds);
      setItems((prev) =>
        prev.map((item) =>
          item.id === listingId
            ? { ...item, likes_count: item.likes_count + (isSaved ? 1 : -1) }
            : item,
        ),
      );
    }
  };

  // Filter and sort items
  let filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort items
  if (sortBy === "price-low") {
    filteredItems = [...filteredItems].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high") {
    filteredItems = [...filteredItems].sort((a, b) => b.price - a.price);
  } else if (sortBy === "popular") {
    filteredItems = [...filteredItems].sort((a, b) => b.likes_count - a.likes_count);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Marketplace</h1>
        <p className="text-gray-600">Discover items from your fellow Menlo School students</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {ITEM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="md:col-span-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
          className={selectedCategory === "all" ? "bg-[#0A1E3C]" : ""}
        >
          All Items
        </Button>
        {ITEM_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory === cat ? "bg-[#0A1E3C]" : ""}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{loading ? "…" : filteredItems.length}</span> items
        </p>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">Loading listings…</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Link key={item.id} to={`/item/${item.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="relative">
                  <img
                    src={resolveListingImageUrl(item.image_url)}
                    alt={item.title}
                    className="w-full h-48 object-cover bg-gray-100"
                  />
                  <Badge className="absolute top-3 right-3 bg-white text-gray-900 hover:bg-white">
                    {item.condition}
                  </Badge>
                  <button
                    className="absolute top-3 left-3 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    onClick={(e) => toggleSave(e, item.id)}
                  >
                    <Heart
                      size={16}
                      className={savedIds.has(item.id) ? "text-red-500" : "text-gray-600"}
                      fill={savedIds.has(item.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">{item.title}</h3>
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
                        <Heart size={12} /> {item.likes_count}
                      </span>
                      <span>{item.views_count} views</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No items found matching your criteria</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
