export type FoundItem = {
  _id?: string;
  title: string;
  description: string;
  dateFound: string; // ISO
  foundLocation: {
    lat: number;
    lng: number;
    description: string;
  };
  categories: FoundItemCategory[];
  securityQuestions: [string, string];
  contactMethod: "email" | "phone" | "other";
  contactDetails: string;
  createdBy: string;
  status?: "active" | "expired" | "returned";
};

export const foundItemCategories = [
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

export type FoundItemCategory = (typeof foundItemCategories)[number];
