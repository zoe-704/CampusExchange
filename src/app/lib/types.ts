import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingWithSeller = Listing & { seller: Profile };
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type ReportRow = Database["public"]["Tables"]["reports"]["Row"];

export type ItemCategory = Database["public"]["Enums"]["item_category"];
export type ItemCondition = Database["public"]["Enums"]["item_condition"];
export type ListingStatus = Database["public"]["Enums"]["listing_status"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const ITEM_CATEGORIES: ItemCategory[] = [
  "Textbooks",
  "Uniforms",
  "Electronics",
  "Stationery",
  "Sports Equipment",
  "Other",
];

export const ITEM_CONDITIONS: ItemCondition[] = ["New", "Like New", "Good", "Fair"];

// Safe meetup locations at Menlo School. Kept as a frontend constant rather
// than a DB table — see the comment in supabase/migrations/..._orders.sql.
export type MeetupLocation = {
  id: string;
  name: string;
  description: string;
};

export const MEETUP_LOCATIONS: MeetupLocation[] = [
  {
    id: "Main Library Entrance",
    name: "Main Library Entrance",
    description: "Outside the main library during school hours",
  },
  {
    id: "Student Center Lobby",
    name: "Student Center Lobby",
    description: "Inside the student center near the information desk",
  },
  {
    id: "Cafeteria Area",
    name: "Cafeteria Area",
    description: "Near the cafeteria entrance during lunch hours",
  },
  {
    id: "Athletic Center Front Desk",
    name: "Athletic Center Front Desk",
    description: "Main entrance of the athletic center",
  },
];

// Static AI-style price bands per category. Not a real model — matches the
// original mock's AI_PRICING_SUGGESTIONS, which was itself a static table.
export const PRICING_SUGGESTIONS: Record<ItemCategory, { min: number; avg: number; max: number }> = {
  Textbooks: { min: 20, avg: 45, max: 80 },
  Uniforms: { min: 10, avg: 20, max: 35 },
  Electronics: { min: 25, avg: 60, max: 150 },
  Stationery: { min: 5, avg: 10, max: 20 },
  "Sports Equipment": { min: 15, avg: 40, max: 100 },
  Other: { min: 5, avg: 25, max: 75 },
};
