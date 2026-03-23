import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
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
import { MOCK_ITEMS, MEETUP_LOCATIONS, MeetupLocation } from "../data/mockData";
import { format } from "date-fns";

export function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = MOCK_ITEMS.find((i) => i.id === id);

  const [isLiked, setIsLiked] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

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

  const handleBuyClick = () => {
    setShowBuyDialog(true);
  };

  const handleConfirmPurchase = () => {
    if (!selectedLocation) {
      alert("Please select a meetup location");
      return;
    }
    // Handle purchase logic
    setShowBuyDialog(false);
    navigate("/messages");
  };

  const handleFlagItem = () => {
    // Handle flag logic
    setShowFlagDialog(false);
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
              src={item.image}
              alt={item.title}
              className="w-full h-[500px] object-cover"
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
              onClick={handleBuyClick}
            >
              Buy Now
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "text-red-500" : ""} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={() => navigate("/messages")}
            >
              <MessageCircle size={20} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 text-red-500 hover:text-red-600"
              onClick={() => setShowFlagDialog(true)}
            >
              <Flag size={20} />
            </Button>
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
                <span className="font-semibold">{format(new Date(item.postedDate), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Views:</span>
                <span className="font-semibold">{item.views}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Likes:</span>
                <span className="font-semibold">{item.likes}</span>
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
                  <AvatarFallback className="text-white text-xl">
                    {item.seller.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{item.seller.name}</h3>
                    {item.seller.isVerified && (
                      <ShieldCheck size={18} className="text-[#0A1E3C]" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.seller.email}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{item.seller.rating}</span>
                    </div>
                    <span className="text-gray-600">
                      {item.seller.completedTransactions} completed sales
                    </span>
                  </div>
                  <div className="mt-3">
                    <Button variant="outline" className="w-full" onClick={() => navigate("/messages")}>
                      <MessageCircle size={16} className="mr-2" />
                      Contact Seller
                    </Button>
                  </div>
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
            <DialogDescription>
              Select a safe meetup location to complete this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded" />
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
            <Button className="bg-[#0A1E3C]" onClick={handleConfirmPurchase}>
              Confirm Purchase
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
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              This report will be reviewed by our moderation team. Common reasons for reporting:
            </p>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Prohibited item (homework, exam materials, etc.)</li>
              <li>Misleading description or photos</li>
              <li>Inappropriate content</li>
              <li>Suspected scam or fraud</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleFlagItem}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}