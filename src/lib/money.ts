/**
 * Money is stored and passed around as integer paisa. Convert only at the edges:
 * parse on input, format on display. Nothing in between should see a float.
 */

const RUPEE_FORMAT = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 155000 -> "Rs 1,550" */
export function formatPaisa(paisa: number): string {
  return RUPEE_FORMAT.format(Math.round(paisa / 100));
}

/** 155000 -> "1550.00", for form fields and CSV export. */
export function paisaToRupeeString(paisa: number): string {
  return (paisa / 100).toFixed(2);
}

/** "1550" or "1550.50" -> 155000 / 155050. Throws on nonsense input. */
export function rupeeStringToPaisa(value: string): number {
  const trimmed = value.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`Invalid rupee amount: ${value}`);
  }
  return Math.round(Number.parseFloat(trimmed) * 100);
}
