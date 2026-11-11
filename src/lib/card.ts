import { pricing } from "@/content/pricing";

const digits = (s: string) => s.replace(/\D/g, "");

/** The mocked checkout only accepts the test card. */
export function isTestCard(cardNumber: string): boolean {
  return digits(cardNumber) === digits(pricing.testCard);
}

/** Formats typing as "4242 4242 4242 4242". */
export function formatCardNumber(input: string): string {
  return digits(input).slice(0, 16).replace(/(.{4})(?=.)/g, "$1 ");
}
