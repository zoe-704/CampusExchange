import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { PlusCircle, Edit, Trash2, Eye, Heart } from "lucide-react";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { resolveListingImageUrl } from "@/app/lib/storage";
import type { Listing } from "@/app/lib/types";

const STATUS_LABEL: Record<Listing["status"], string> = {
  available: "Available",
  sold: "Sold",
  removed: "Removed",
};

export function MyListings() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    supabase
      .from("listings")
      .select("*")
      .eq("seller_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setListings(data ?? []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  const handleEdit = (id: string) => {
    navigate(`/my-listings/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    const previous = listings;
    setListings((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      setListings(previous);
      alert("Couldn't delete this listing. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
          <p className="text-gray-600">Manage your posted items</p>
        </div>
        <Link to="/create">
          <Button className="bg-[#0A1E3C] hover:bg-[#050F1E]">
            <PlusCircle size={20} className="mr-2" />
            Post New Item
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#0A1E3C]">{listings.length}</p>
              <p className="text-sm text-gray-600 mt-1">Active Listings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {listings.reduce((sum, item) => sum + item.views_count, 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {listings.reduce((sum, item) => sum + item.likes_count, 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Likes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listings */}
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {listings.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="sm:w-48 flex-shrink-0">
                    <img
                      src={resolveListingImageUrl(item.image_url)}
                      alt={item.title}
                      className="w-full h-48 object-cover bg-gray-100"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={item.status === "available" ? "default" : "secondary"}
                            className={item.status === "available" ? "bg-green-500" : ""}
                          >
                            {STATUS_LABEL[item.status]}
                          </Badge>
                          <Badge variant="outline">{item.category}</Badge>
                          <Badge variant="outline">{item.condition}</Badge>
                        </div>
                        <Link to={`/item/${item.id}`}>
                          <h3 className="text-xl font-semibold text-gray-900 hover:text-[#0A1E3C] mb-2">
                            {item.title}
                          </h3>
                        </Link>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{item.description}</p>
                      </div>
                      {/* Plain always-visible buttons rather than a dropdown — a
                          Radix DropdownMenu nested this deep in the card layout
                          was positioning its portaled content nowhere near the
                          trigger (a floating-ui measurement bug reproducible in
                          both dev and prod builds); this sidesteps it entirely. */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid="listing-edit-button"
                          onClick={() => handleEdit(item.id)}
                          aria-label="Edit listing"
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid="listing-delete-button"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-700"
                          aria-label="Delete listing"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#0A1E3C]">${item.price}</div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye size={16} />
                          {item.views_count} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={16} />
                          {item.likes_count} likes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <PlusCircle size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
          <p className="text-gray-600 mb-6">Start by posting your first item</p>
          <Link to="/create">
            <Button className="bg-[#0A1E3C] hover:bg-[#050F1E]">
              <PlusCircle size={20} className="mr-2" />
              Post Your First Item
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
