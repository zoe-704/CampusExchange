import { supabase } from "./supabase";

const LISTING_IMAGES_BUCKET = "listing-images";

// listings.image_url holds either a full external URL (seed data uses
// Unsplash links directly) or a Storage object path (real uploads via
// CreatePost, stored as "<uploader_uid>/<random>.<ext>" — see the storage
// migration). Resolve whichever it is to something an <img src> can use.
export function resolveListingImageUrl(imageUrl: string | null): string | undefined {
  if (!imageUrl) return undefined;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(imageUrl).data.publicUrl;
}

export async function uploadListingImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(LISTING_IMAGES_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}
