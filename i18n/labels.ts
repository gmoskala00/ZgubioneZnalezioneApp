export const CATEGORY_LABELS = {
  keys: "Klucze",
  wallet: "Portfel",
  phone: "Telefon",
  electronics: "Elektronika",
  documents: "Dokumenty",
  clothing: "Ubrania",
  jewelry: "Biżuteria",
  bag: "Torba / plecak",
  pet: "Zwierzę",
  other: "Inne",
} as const;

export const CONTACT_METHOD_LABELS = {
  email: "E-mail",
  phone: "Telefon",
  other: "Inne",
} as const;

export const labelCategory = (key: keyof typeof CATEGORY_LABELS) =>
  CATEGORY_LABELS[key] ?? key;

export const labelContact = (key: keyof typeof CONTACT_METHOD_LABELS) =>
  CONTACT_METHOD_LABELS[key] ?? key;
