import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import DOMPurify from "dompurify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Safely sanitize HTML content for display
export function sanitizeHtml(html: string): string {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    // Server-side: return plain text by stripping HTML tags
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  // Client-side: use DOMPurify to sanitize HTML
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "strong", "em", "span", "div", "br"],
    ALLOWED_ATTR: ["style", "dir", "data-mention-id", "data-mention-name"],
    KEEP_CONTENT: true,
  });
}

/**
 * Formats a number as South African Rand currency.
 * Format: R{number} with spaces as thousand separators and comma as decimal separator.
 * @param amount - The amount to format
 * @param includePrefix - Whether to include the "R" prefix (default: true)
 * @param showDecimals - Whether to show decimal places (default: true)
 * Example: 19000000 -> "R19 000 000,00" (with decimals) or "R19 000 000" (without)
 */
export function formatCurrency(
  amount: string | number | null | undefined,
  includePrefix: boolean = true,
  showDecimals: boolean = true
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "";
  }

  const numberValue = Number(amount);
  if (Number.isNaN(numberValue)) {
    return "";
  }

  // Round to 2 decimal places if showing decimals, otherwise round to integer
  const rounded = showDecimals 
    ? Math.round(numberValue * 100) / 100
    : Math.round(numberValue);
  
  // Split into integer and decimal parts
  const parts = showDecimals 
    ? Math.abs(rounded).toFixed(2).split(".")
    : [Math.abs(rounded).toString(), ""];
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add space separators every 3 digits from right to left
  let formattedInteger = "";
  for (let i = integerPart.length - 1, count = 0; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      formattedInteger = " " + formattedInteger;
    }
    formattedInteger = integerPart[i] + formattedInteger;
    count++;
  }

  // Handle negative numbers
  const sign = numberValue < 0 ? "-" : "";
  const prefix = includePrefix ? "R" : "";
  
  // Only include decimal part if showing decimals
  const decimalSuffix = showDecimals && decimalPart ? `,${decimalPart}` : "";
  
  return `${sign}${prefix}${formattedInteger}${decimalSuffix}`;
}

/**
 * Parses a formatted currency string back to a numeric string.
 * Removes R prefix, spaces, and converts comma decimal separator to dot.
 * Example: "R19 000 000,00" -> "19000000.00"
 */
export function parseCurrency(formattedValue: string): string {
  if (!formattedValue || formattedValue.trim() === "") {
    return "";
  }

  // Remove R prefix, spaces, and handle negative sign
  let cleaned = formattedValue.trim();
  
  // Handle negative sign (could be before or after R)
  const isNegative = cleaned.startsWith("-");
  cleaned = cleaned.replace(/^-?R?/i, "").replace(/\s+/g, "");
  
  // Replace comma decimal separator with dot
  cleaned = cleaned.replace(",", ".");
  
  // Validate it's a valid number
  const numberValue = Number(cleaned);
  if (Number.isNaN(numberValue)) {
    return "";
  }

  // Return as string with negative sign if needed
  return isNegative ? `-${numberValue}` : String(numberValue);
}

export function formatDate(date: string | null | undefined) {
  if (!date) {
    return "N/A";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleDateString();
}
