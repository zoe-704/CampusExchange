import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Badge } from "./ui/badge";
import { Upload, Sparkles, DollarSign, CheckCircle } from "lucide-react";
import { useAuth } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { resolveListingImageUrl, uploadListingImage } from "@/app/lib/storage";
import {
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  PRICING_SUGGESTIONS,
  type ItemCategory,
  type ItemCondition,
} from "@/app/lib/types";

export function CreatePost() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const isEditMode = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [condition, setCondition] = useState<ItemCondition>("Good");
  const [price, setPrice] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode || !id || !profile) return;
    let cancelled = false;

    supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data || data.seller_id !== profile.id) {
          navigate("/my-listings", { replace: true });
          return;
        }
        setTitle(data.title);
        setDescription(data.description);
        setCategory(data.category);
        setCondition(data.condition);
        setPrice(String(data.price));
        setExistingImageUrl(data.image_url);
        setImagePreview(resolveListingImageUrl(data.image_url) ?? "");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEditMode, profile, navigate]);

  const priceSuggestion = category ? PRICING_SUGGESTIONS[category] : null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !category) return;

    setSubmitting(true);
    setError(null);

    try {
      let imageUrl = existingImageUrl;
      if (imageFile) {
        imageUrl = await uploadListingImage(profile.id, imageFile);
      }

      if (isEditMode && id) {
        const { error: updateError } = await supabase
          .from("listings")
          .update({
            title,
            description,
            category,
            condition,
            price: Number(price),
            image_url: imageUrl,
          })
          .eq("id", id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("listings").insert({
          school_id: profile.school_id,
          seller_id: profile.id,
          title,
          description,
          category,
          condition,
          price: Number(price),
          image_url: imageUrl,
        });
        if (insertError) throw insertError;
      }

      navigate("/my-listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const applySuggestedPrice = (suggestedPrice: number) => {
    setPrice(suggestedPrice.toString());
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{isEditMode ? "Edit Listing" : "Post a New Item"}</h1>
        <p className="text-gray-600">
          {isEditMode ? "Update your listing's details" : "List your item for fellow Menlo School students"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Item Photos</CardTitle>
                <CardDescription>Upload a clear photo of your item</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview("");
                          setImageFile(null);
                        }}
                      >
                        Change Photo
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2563EB] transition-colors">
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="mb-2 text-sm text-gray-600">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Item Details */}
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
                <CardDescription>Provide information about your item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., AP Biology Textbook - Campbell Edition"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the condition, features, and any important details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    required
                  />
                  <p className="text-xs text-gray-500">Be honest and detailed to build trust with buyers</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category ?? ""} onValueChange={(value) => setCategory(value as ItemCategory)}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condition *</Label>
                    <RadioGroup value={condition} onValueChange={(value) => setCondition(value as ItemCondition)}>
                      <div className="grid grid-cols-2 gap-2">
                        {ITEM_CONDITIONS.map((cond) => (
                          <div key={cond} className="flex items-center space-x-2">
                            <RadioGroupItem value={cond} id={cond} />
                            <Label htmlFor={cond} className="font-normal cursor-pointer">
                              {cond}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="text-[#0A1E3C]" size={20} />
                  Pricing
                </CardTitle>
                <CardDescription>Set a fair price for your item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="pl-8"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {priceSuggestion && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="text-[#0A1E3C] mt-0.5 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          AI Price Suggestions
                          <Badge variant="secondary" className="text-xs">
                            Powered by AI
                          </Badge>
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <button
                            type="button"
                            onClick={() => applySuggestedPrice(priceSuggestion.min)}
                            className="bg-white border border-gray-300 rounded-lg p-3 hover:border-[#0A1E3C] hover:bg-blue-50 transition-colors text-left"
                          >
                            <div className="text-gray-600 text-xs mb-1">Budget</div>
                            <div className="font-bold text-[#0A1E3C]">${priceSuggestion.min}</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => applySuggestedPrice(priceSuggestion.avg)}
                            className="bg-white border-2 border-[#0A1E3C] rounded-lg p-3 hover:bg-blue-50 transition-colors text-left"
                          >
                            <div className="text-gray-600 text-xs mb-1">Recommended</div>
                            <div className="font-bold text-[#0A1E3C]">${priceSuggestion.avg}</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => applySuggestedPrice(priceSuggestion.max)}
                            className="bg-white border border-gray-300 rounded-lg p-3 hover:border-[#0A1E3C] hover:bg-blue-50 transition-colors text-left"
                          >
                            <div className="text-gray-600 text-xs mb-1">Premium</div>
                            <div className="font-bold text-[#0A1E3C]">${priceSuggestion.max}</div>
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Based on similar {category} items on Campus Exchange
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview && title ? (
                  <div className="space-y-3">
                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2">{title}</h3>
                      {price && <p className="text-lg font-bold text-[#0A1E3C] mt-1">${price}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">Add photos and details to see preview</p>
                )}
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Posting Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use clear, well-lit photos</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Be honest about condition</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Price items fairly</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>No prohibited items (homework, exams)</span>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting || !category}
              className="w-full bg-[#0A1E3C] hover:bg-[#050F1E] h-12"
            >
              {submitting ? "Saving…" : isEditMode ? "Save Changes" : "Post Item"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
