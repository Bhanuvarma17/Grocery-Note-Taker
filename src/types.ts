export interface Item {
  id: string;
  name: string;
  amount?: string; // Flexible quantity + unit, e.g., "2 kg", "1 bunch", "6 pieces", "3 packets" (NOT a price)
  note?: string; // Optional note, e.g., "ripe", "for soup", "low fat"
  category?: string; // Optional category grouping
  isCompleted: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface ListSession {
  id: string; // Stable unique identifier
  listDate: string; // YYYY-MM-DD
  title?: string; // Optional custom title, e.g., "Farmers Market", "Weekly staples"
  items: Item[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export type ProduceCategory =
  | 'Vegetables'
  | 'Fruits'
  | 'Dairy & Eggs'
  | 'Pantry & Spices'
  | 'Bakery & Bread'
  | 'Household & Cleaning'
  | 'Beverages'
  | 'Other';

export const COMMON_CATEGORIES: ProduceCategory[] = [
  'Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Pantry & Spices',
  'Bakery & Bread',
  'Household & Cleaning',
  'Beverages',
  'Other',
];

export const QUICK_AMOUNTS = [
  '1 kg',
  '2 kg',
  '500 g',
  '1 bunch',
  '1 dozen',
  '2 packets',
  '1 box',
  '2 bottles',
  '6 pieces',
];
