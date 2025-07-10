export type FoundItem = {
  _id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  dateFound: string;
  foundLocation: {
    lat: number;
    lng: number;
    description: string;
  };
  stillHasItem: boolean;
  placeWhereLeft?: string;
  contactMethod: "email" | "phone" | "other";
  contactDetails: string;
  createdBy: string;
  status?: "active" | "expired" | "returned";
};
