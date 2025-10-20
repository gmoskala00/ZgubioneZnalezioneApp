export const FOUND_ITEM_CATEGORIES = [
  "keys",
  "wallet",
  "phone",
  "electronics",
  "documents",
  "clothing",
  "jewelry",
  "bag",
  "pet",
  "other",
] as const;

export type FoundItemCategory = (typeof FOUND_ITEM_CATEGORIES)[number];
