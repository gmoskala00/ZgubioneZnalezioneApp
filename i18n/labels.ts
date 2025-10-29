// i18n/labels.ts
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

export const STATUS_LABELS = {
  pending: "Oczekujące",
  approved: "Zatwierdzone",
  rejected: "Odrzucone",
  archived: "Archiwalne",
  completed: "Zakończone",
  expired: "Wygasłe",
} as const;

/** Kategorie przedmiotów */
export const labelCategory = (key: keyof typeof CATEGORY_LABELS) =>
  CATEGORY_LABELS[key] ?? key;

/** Metody kontaktu */
export const labelContact = (key: keyof typeof CONTACT_METHOD_LABELS) =>
  CONTACT_METHOD_LABELS[key] ?? key;

/** Statusy zgłoszeń / odpowiedzi */
export const labelStatus = (key: string): string => {
  return STATUS_LABELS[key as keyof typeof STATUS_LABELS] ?? key.toUpperCase();
};
