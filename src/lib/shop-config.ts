/**
 * Shop-wide settings. The placeholders marked TODO must be replaced with real
 * values before taking a live order — the checkout page renders them verbatim.
 */

export const SHOP = {
  name: "ClayCreations",
  tagline: "Handmade polymer clay jewellery",
  instagram: "claycreations81",
  instagramUrl: "https://instagram.com/claycreations81",

  /** International format, digits only, no + or spaces. Used to build wa.me links. */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923001234567",

  /** Flat shipping fee in paisa. Set to 0 for free delivery. */
  shippingPaisa: 25000,

  /** Order total in paisa above which shipping is waived. Null disables the rule. */
  freeShippingThresholdPaisa: 500000,

  // TODO: replace with real bank details before going live.
  bank: {
    accountTitle: "ClayCreations",
    bankName: "Meezan Bank",
    accountNumber: "0000 0000 0000 0000",
    iban: "PK00MEZN0000000000000000",
    branch: "—",
  },
} as const;

export function isPlaceholderBankDetails(): boolean {
  return SHOP.bank.accountNumber.replace(/\s/g, "") === "0000000000000000";
}

export function isPlaceholderWhatsapp(): boolean {
  return SHOP.whatsappNumber === "923001234567";
}
