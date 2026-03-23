// Mock data for Campus Exchange

export type ItemCategory = "Textbooks" | "Uniforms" | "Electronics" | "Stationery" | "Sports Equipment" | "Other";

export type ItemCondition = "New" | "Like New" | "Good" | "Fair";

export type MeetupLocation = {
  id: string;
  name: string;
  description: string;
  isVerified: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
  joinedDate: string;
  rating: number;
  completedTransactions: number;
};

export type Item = {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  price: number;
  image: string;
  condition: ItemCondition;
  seller: User;
  postedDate: string;
  isAvailable: boolean;
  likes: number;
  views: number;
  isFlagged?: boolean;
};

export type Message = {
  id: string;
  itemId: string;
  itemTitle: string;
  otherUser: User;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
};

export type Order = {
  id: string;
  item: Item;
  buyer: User;
  seller: User;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  meetupLocation?: MeetupLocation;
  meetupTime?: string;
  createdDate: string;
};

// Safe meetup locations at Menlo School
export const MEETUP_LOCATIONS: MeetupLocation[] = [
  {
    id: "loc1",
    name: "Main Library Entrance",
    description: "Outside the main library during school hours",
    isVerified: true,
  },
  {
    id: "loc2",
    name: "Student Center Lobby",
    description: "Inside the student center near the information desk",
    isVerified: true,
  },
  {
    id: "loc3",
    name: "Cafeteria Area",
    description: "Near the cafeteria entrance during lunch hours",
    isVerified: true,
  },
  {
    id: "loc4",
    name: "Athletic Center Front Desk",
    description: "Main entrance of the athletic center",
    isVerified: true,
  },
];

// Mock users
export const MOCK_USERS: User[] = [
  {
    id: "user1",
    name: "Sarah Johnson",
    email: "sjohnson@menloschool.edu",
    isVerified: true,
    joinedDate: "2025-09-01",
    rating: 4.8,
    completedTransactions: 12,
  },
  {
    id: "user2",
    name: "Alex Chen",
    email: "achen@menloschool.edu",
    isVerified: true,
    joinedDate: "2025-08-15",
    rating: 4.9,
    completedTransactions: 8,
  },
  {
    id: "user3",
    name: "Marcus Williams",
    email: "mwilliams@menloschool.edu",
    isVerified: true,
    joinedDate: "2025-10-01",
    rating: 5.0,
    completedTransactions: 15,
  },
  {
    id: "user4",
    name: "Emma Rodriguez",
    email: "erodriguez@menloschool.edu",
    isVerified: true,
    joinedDate: "2025-09-20",
    rating: 4.7,
    completedTransactions: 6,
  },
  {
    id: "user5",
    name: "James Park",
    email: "jpark@menloschool.edu",
    isVerified: true,
    joinedDate: "2025-08-01",
    rating: 4.9,
    completedTransactions: 20,
  },
];

// Current logged-in user
export const CURRENT_USER: User = {
  id: "currentUser",
  name: "You",
  email: "student@menloschool.edu",
  isVerified: true,
  joinedDate: "2025-08-01",
  rating: 5.0,
  completedTransactions: 5,
};

// Mock items
export const MOCK_ITEMS: Item[] = [
  {
    id: "item1",
    title: "AP Biology Textbook - Campbell Edition",
    description: "Gently used AP Biology textbook. No highlighting, minimal wear. Perfect for upcoming semester.",
    category: "Textbooks",
    price: 45,
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
    condition: "Like New",
    seller: MOCK_USERS[0],
    postedDate: "2026-02-10",
    isAvailable: true,
    likes: 8,
    views: 45,
  },
  {
    id: "item2",
    title: "Scientific Calculator TI-84 Plus",
    description: "Works perfectly, comes with protective case. Great for math and science classes.",
    category: "Electronics",
    price: 60,
    image: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800&q=80",
    condition: "Good",
    seller: MOCK_USERS[1],
    postedDate: "2026-02-09",
    isAvailable: true,
    likes: 12,
    views: 67,
  },
  {
    id: "item3",
    title: "School Polo Uniform (Medium)",
    description: "Official Menlo School polo, size medium. Worn only a few times, excellent condition.",
    category: "Uniforms",
    price: 15,
    image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80",
    condition: "Like New",
    seller: MOCK_USERS[2],
    postedDate: "2026-02-08",
    isAvailable: true,
    likes: 5,
    views: 32,
  },
  {
    id: "item4",
    title: "Complete Notebook Set - 5 Subjects",
    description: "Brand new, never used. 5-subject notebooks perfect for organizing your classes.",
    category: "Stationery",
    price: 10,
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80",
    condition: "New",
    seller: MOCK_USERS[3],
    postedDate: "2026-02-11",
    isAvailable: true,
    likes: 15,
    views: 89,
  },
  {
    id: "item5",
    title: "Tennis Racket - Wilson Pro Staff",
    description: "Lightly used tennis racket. Re-strung last month. Perfect for tennis PE class or team.",
    category: "Sports Equipment",
    price: 35,
    image: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800&q=80",
    condition: "Good",
    seller: MOCK_USERS[4],
    postedDate: "2026-02-07",
    isAvailable: true,
    likes: 6,
    views: 41,
  },
  {
    id: "item6",
    title: "Calculus: Early Transcendentals",
    description: "James Stewart textbook for AP Calculus. Some notes in margins, all pages intact.",
    category: "Textbooks",
    price: 50,
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80",
    condition: "Good",
    seller: MOCK_USERS[0],
    postedDate: "2026-02-06",
    isAvailable: true,
    likes: 10,
    views: 78,
  },
  {
    id: "item7",
    title: "Laptop Sleeve 13-inch",
    description: "Protective laptop sleeve with padding. Fits MacBook Air/Pro 13-inch perfectly.",
    category: "Electronics",
    price: 12,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80",
    condition: "Like New",
    seller: MOCK_USERS[1],
    postedDate: "2026-02-11",
    isAvailable: true,
    likes: 9,
    views: 55,
  },
  {
    id: "item8",
    title: "Premium Pen Set - Pilot G2",
    description: "Pack of 12 Pilot G2 pens (assorted colors). 8 pens remaining, never used.",
    category: "Stationery",
    price: 8,
    image: "https://images.unsplash.com/photo-1586158291800-2665f07bba62?w=800&q=80",
    condition: "Like New",
    seller: MOCK_USERS[2],
    postedDate: "2026-02-05",
    isAvailable: true,
    likes: 7,
    views: 44,
  },
  {
    id: "item9",
    title: "School Backpack - North Face",
    description: "Durable North Face backpack with laptop compartment. Used for one semester.",
    category: "Other",
    price: 40,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    condition: "Good",
    seller: MOCK_USERS[3],
    postedDate: "2026-02-12",
    isAvailable: true,
    likes: 14,
    views: 92,
  },
  {
    id: "item10",
    title: "Basketball Shoes - Nike Size 10",
    description: "Nike basketball shoes, size 10. Great condition, only worn for PE class.",
    category: "Sports Equipment",
    price: 45,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    condition: "Good",
    seller: MOCK_USERS[4],
    postedDate: "2026-02-04",
    isAvailable: true,
    likes: 11,
    views: 63,
  },
];

// Mock messages
export const MOCK_MESSAGES: Message[] = [
  {
    id: "msg1",
    itemId: "item2",
    itemTitle: "Scientific Calculator TI-84 Plus",
    otherUser: MOCK_USERS[1],
    lastMessage: "Yes, it's still available! When would you like to meet?",
    timestamp: "2026-02-12T10:30:00",
    unread: true,
  },
  {
    id: "msg2",
    itemId: "item6",
    itemTitle: "Calculus: Early Transcendentals",
    otherUser: MOCK_USERS[0],
    lastMessage: "The Student Center works for me. See you at 3pm!",
    timestamp: "2026-02-11T15:45:00",
    unread: false,
  },
];

// Mock orders
export const MOCK_ORDERS: Order[] = [
  {
    id: "order1",
    item: MOCK_ITEMS[5],
    buyer: CURRENT_USER,
    seller: MOCK_USERS[0],
    status: "confirmed",
    meetupLocation: MEETUP_LOCATIONS[1],
    meetupTime: "2026-02-13T15:00:00",
    createdDate: "2026-02-11",
  },
  {
    id: "order2",
    item: MOCK_ITEMS[1],
    buyer: CURRENT_USER,
    seller: MOCK_USERS[1],
    status: "pending",
    createdDate: "2026-02-12",
  },
];

// Mock items posted by current user
export const MY_LISTINGS: Item[] = [
  {
    id: "myitem1",
    title: "Chemistry Lab Goggles",
    description: "Safety goggles for chemistry lab. Never used, still in original packaging.",
    category: "Other",
    price: 8,
    image: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=800&q=80",
    condition: "New",
    seller: CURRENT_USER,
    postedDate: "2026-02-10",
    isAvailable: true,
    likes: 4,
    views: 28,
  },
  {
    id: "myitem2",
    title: "Spanish Dictionary - Larousse",
    description: "Comprehensive Spanish-English dictionary. Great for language classes.",
    category: "Textbooks",
    price: 12,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80",
    condition: "Like New",
    seller: CURRENT_USER,
    postedDate: "2026-02-08",
    isAvailable: true,
    likes: 6,
    views: 35,
  },
];

// Mock saved/liked items
export const SAVED_ITEMS: Item[] = [MOCK_ITEMS[0], MOCK_ITEMS[3], MOCK_ITEMS[6], MOCK_ITEMS[8]];

// AI pricing suggestions based on category
export const AI_PRICING_SUGGESTIONS: Record<ItemCategory, { min: number; avg: number; max: number }> = {
  Textbooks: { min: 20, avg: 45, max: 80 },
  Uniforms: { min: 10, avg: 20, max: 35 },
  Electronics: { min: 25, avg: 60, max: 150 },
  Stationery: { min: 5, avg: 10, max: 20 },
  "Sports Equipment": { min: 15, avg: 40, max: 100 },
  Other: { min: 5, avg: 25, max: 75 },
};
