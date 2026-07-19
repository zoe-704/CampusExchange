import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Heart, Flag, MessageCircle, MapPin, Star, ShieldCheck, ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { resolveListingImageUrl } from "@/app/lib/storage";
import { MEETUP_LOCATIONS, type ListingWithSeller } from "@/app/lib/types";

export function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [item, setItem] = useState<ListingWithSeller | null | undefined>(undefined);
  const [isSaved, setIsSaved] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [flagReason, setFlagReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const viewCountedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!id || !profile) return;
    let cancelled = false;

    async function load() {
      const [listingRes, savedRes] = await Promise.all([
        supabase
          .from("listings")
          .select("*, seller:profiles!listings_seller_id_fkey(*)")
          .eq("id", id!)
          .maybeSingle(),
        supabase.from("saved_items").select("listing_id").eq("user_id", profile!.id).eq("listing_id", id!).maybeSingle(),
      ]);
      if (cancelled) return;
      setItem((listingRes.data as ListingWithSeller | null) ?? null);
      setIsSaved(!!savedRes.data);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, profile]);

  useEffect(() => {
    if (!id || viewCountedFor.current === id) return;
    viewCountedFor.current = id;
    supabase.rpc("increment_listing_views", { listing_id_input: id });
  }, [id]);

  if (item === undefined) {
    return <div className="text-center py-16 text-gray-500">Loading…</div>;
  }

  if (!item) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Item not found</h2>
        <Link to="/browse">
          <Button className="bg-[#0A1E3C]">Browse Items</Button>
        </Link>
      </div>
    );
  }

  const isOwnListing = profile?.id === item.seller_id;

  const toggleSave = async () => {
    if (!profile) return;
    const next = !isSaved;
    setIsSaved(next);
    setItem((prev) => (prev ? { ...prev, likes_count: prev.likes_count + (next ? 1 : -1) } : prev));

    const { error } = next
      ? await supabase.from("saved_items").insert({ user_id: profile.id, listing_id: item.id })
      : await supabase.from("saved_items").delete().eq("user_id", profile.id).eq("listing_id", item.id);

    if (error) {
      setIsSaved(!next);
      setItem((prev) => (prev ? { ...prev, likes_count: prev.likes_count + (next ? -1 : 1) } : prev));
    }
  };

  const goToThread = () => {
    navigate(`/messages?listingId=${item.id}&otherUserId=${item.seller_id}`);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedLocation || !profile) {
      alert("Please select a meetup location");
      return;
    }
    setSubmitting(true);

    const location = MEETUP_LOCATIONS.find((loc) => loc.id === selectedLocation);

    const { error: orderError } = await supabase.from("orders").insert({
      listing_id: item.id,
      buyer_id: profile.id,
      seller_id: item.seller_id,
      status: "pending",
      meetup_location: location?.name ?? selectedLocation,
    });

    if (orderError) {
      setSubmitting(false);
      alert("Couldn't complete this purchase. Please try again.");
      return;
    }

    // Best-effort — the order is the artifact that matters; don't fail the
    // whole purchase over the opening message not sending.
    await supabase.from("messages").insert({
      listing_id: item.id,
      sender_id: profile.id,
      recipient_id: item.seller_id,
      body: `I'd like to buy "${item.title}" for $${item.price}. Could we meet at ${location?.name}?`,
    });

    setSubmitting(false);
    setShowBuyDialog(false);
    navigate(`/messages?listingId=${item.id}&otherUserId=${item.seller_id}`);
  };

  const handleFlagItem = async () => {
    if (!profile) return;
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      listing_id: item.id,
      reporter_id: profile.id,
      reason: flagReason.trim() || "Reported via community guidelines flag.",
    });
    setSubmitting(false);

    if (error) {
      alert("Couldn't submit this report. Please try again.");
      return;
    }

    setShowFlagDialog(false);
    setFlagReason("");
    alert("Item has been flagged for review. Our moderators will investigate.");
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft size={20} className="mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={resolveListingImageUrl(item.image_url)}
              alt={item.title}
              className="w-full h-[500px] object-cover bg-gray-100"
            />
            <Badge className="absolute top-4 right-4 bg-white text-gray-900 hover:bg-white text-base px-4 py-2">
              {item.condition}
            </Badge>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          {/* Title and Price */}
          <div>
            <Badge className="mb-3">{item.category}</Badge>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h1>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[#0A1E3C]">${item.price}</span>
              <span className="text-gray-500">or best offer</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-[#0A1E3C] hover:bg-[#050F1E] text-lg h-12"
              onClick={() => setShowBuyDialog(true)}
              disabled={isOwnListing || item.status !== "available"}
            >
              {isOwnListing ? "Your Listing" : item.status !== "available" ? "Sold" : "Buy Now"}
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12" onClick={toggleSave}>
              <Heart size={20} fill={isSaved ? "currentColor" : "none"} className={isSaved ? "text-red-500" : ""} />
            </Button>
            {!isOwnListing && (
              <Button variant="outline" size="icon" className="h-12 w-12" onClick={goToThread}>
                <MessageCircle size={20} />
              </Button>
            )}
            {!isOwnListing && (
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 text-red-500 hover:text-red-600"
                onClick={() => setShowFlagDialog(true)}
              >
                <Flag size={20} />
              </Button>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600 leading-relaxed">{item.description}</p>
          </div>

          <Separator />

          {/* Item Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Item Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Condition:</span>
                <span className="font-semibold">{item.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-semibold">{item.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Posted:</span>
                <span className="font-semibold">{format(new Date(item.created_at), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Views:</span>
                <span className="font-semibold">{item.views_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Likes:</span>
                <span className="font-semibold">{item.likes_count}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Seller Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h2>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 bg-[#0A1E3C]">
                  <AvatarFallback className="text-white text-xl">{item.seller.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{item.seller.full_name}</h3>
                    <ShieldCheck size={18} className="text-[#0A1E3C]" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.seller.email}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{item.seller.rating}</span>
                    </div>
                    <span className="text-gray-600">{item.seller.completed_transactions} completed sales</span>
                  </div>
                  {!isOwnListing && (
                    <div className="mt-3">
                      <Button variant="outline" className="w-full" onClick={goToThread}>
                        <MessageCircle size={16} className="mr-2" />
                        Contact Seller
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-[#0A1E3C] mt-0.5" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-gray-900 mb-1">Safety First</p>
                <p className="text-gray-600">
                  Always meet at verified campus locations during school hours. Report any suspicious activity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>Select a safe meetup location to complete this transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={resolveListingImageUrl(item.image_url)}
                alt={item.title}
                className="w-16 h-16 object-cover rounded bg-gray-100"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-2xl font-bold text-[#0A1E3C]">${item.price}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                <MapPin size={16} className="inline mr-1" />
                Select Meetup Location
              </label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a verified location..." />
                </SelectTrigger>
                <SelectContent>
                  {MEETUP_LOCATIONS.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      <div>
                        <div className="font-medium">{loc.name}</div>
                        <div className="text-xs text-gray-500">{loc.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> The seller will be notified and you can arrange a specific time via messages.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBuyDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-[#0A1E3C]" onClick={handleConfirmPurchase} disabled={submitting}>
              {submitting ? "Confirming…" : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Item</DialogTitle>
            <DialogDescription>
              Help keep Campus Exchange safe. Report items that violate our community guidelines.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">
              This report will be reviewed by our moderation team. Common reasons for reporting:
            </p>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Prohibited item (homework, exam materials, etc.)</li>
              <li>Misleading description or photos</li>
              <li>Inappropriate content</li>
              <li>Suspected scam or fraud</li>
            </ul>
            <Textarea
              placeholder="Add any additional details (optional)"
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleFlagItem} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
