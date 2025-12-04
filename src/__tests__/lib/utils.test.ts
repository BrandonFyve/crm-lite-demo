import { formatCurrency, parseCurrency } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats integer values correctly", () => {
    expect(formatCurrency(19000000)).toBe("R19 000 000,00");
    expect(formatCurrency(1000)).toBe("R1 000,00");
    expect(formatCurrency(100)).toBe("R100,00");
    expect(formatCurrency(1)).toBe("R1,00");
  });

  it("formats decimal values correctly", () => {
    expect(formatCurrency(19000000.5)).toBe("R19 000 000,50");
    expect(formatCurrency(1234.56)).toBe("R1 234,56");
    expect(formatCurrency(0.99)).toBe("R0,99");
  });

  it("formats string numbers correctly", () => {
    expect(formatCurrency("19000000")).toBe("R19 000 000,00");
    expect(formatCurrency("1234.56")).toBe("R1 234,56");
    expect(formatCurrency("0")).toBe("R0,00");
  });

  it("handles null and undefined", () => {
    expect(formatCurrency(null)).toBe("");
    expect(formatCurrency(undefined)).toBe("");
  });

  it("handles empty strings", () => {
    expect(formatCurrency("")).toBe("");
  });

  it("handles invalid numbers", () => {
    expect(formatCurrency("invalid")).toBe("");
    expect(formatCurrency("abc123")).toBe("");
  });

  it("handles negative numbers", () => {
    expect(formatCurrency(-1000)).toBe("-R1 000,00");
    expect(formatCurrency("-500")).toBe("-R500,00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(123.456)).toBe("R123,46");
    expect(formatCurrency(123.454)).toBe("R123,45");
  });

  it("handles very large numbers", () => {
    expect(formatCurrency(999999999999)).toBe("R999 999 999 999,00");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("R0,00");
    expect(formatCurrency("0")).toBe("R0,00");
  });

  it("handles small decimal values", () => {
    expect(formatCurrency(0.01)).toBe("R0,01");
    expect(formatCurrency(0.1)).toBe("R0,10");
  });

  describe("with includePrefix parameter", () => {
    it("includes prefix by default", () => {
      expect(formatCurrency(1000)).toBe("R1 000,00");
      expect(formatCurrency(1000, true)).toBe("R1 000,00");
    });

    it("excludes prefix when includePrefix is false", () => {
      expect(formatCurrency(1000, false)).toBe("1 000,00");
      expect(formatCurrency(19000000, false)).toBe("19 000 000,00");
      expect(formatCurrency(1234.56, false)).toBe("1 234,56");
    });

    it("handles negative numbers without prefix", () => {
      expect(formatCurrency(-1000, false)).toBe("-1 000,00");
      expect(formatCurrency("-500", false)).toBe("-500,00");
    });

    it("handles zero without prefix", () => {
      expect(formatCurrency(0, false)).toBe("0,00");
      expect(formatCurrency("0", false)).toBe("0,00");
    });

    it("handles empty/null/undefined without prefix", () => {
      expect(formatCurrency(null, false)).toBe("");
      expect(formatCurrency(undefined, false)).toBe("");
      expect(formatCurrency("", false)).toBe("");
    });

    it("handles invalid numbers without prefix", () => {
      expect(formatCurrency("invalid", false)).toBe("");
      expect(formatCurrency("abc123", false)).toBe("");
    });
  });
});

describe("parseCurrency", () => {
  it("parses formatted currency strings correctly", () => {
    expect(parseCurrency("R19 000 000,00")).toBe("19000000");
    expect(parseCurrency("R1 234,56")).toBe("1234.56");
    expect(parseCurrency("R1 000,00")).toBe("1000");
  });

  it("parses currency without spaces", () => {
    expect(parseCurrency("R19000000,00")).toBe("19000000");
    expect(parseCurrency("R1234,56")).toBe("1234.56");
  });

  it("parses currency without R prefix", () => {
    expect(parseCurrency("19 000 000,00")).toBe("19000000");
    expect(parseCurrency("1 234,56")).toBe("1234.56");
  });

  it("handles empty strings", () => {
    expect(parseCurrency("")).toBe("");
    expect(parseCurrency("   ")).toBe("");
  });

  it("handles null and undefined", () => {
    expect(parseCurrency(null as unknown as string)).toBe("");
    expect(parseCurrency(undefined as unknown as string)).toBe("");
  });

  it("handles invalid input", () => {
    expect(parseCurrency("invalid")).toBe("");
    expect(parseCurrency("abc123")).toBe("");
  });

  it("handles negative values", () => {
    expect(parseCurrency("-R1 000,00")).toBe("-1000");
    expect(parseCurrency("R-1 000,00")).toBe("-1000");
  });

  it("handles values without decimal part", () => {
    expect(parseCurrency("R1 000")).toBe("1000");
    expect(parseCurrency("R19 000 000")).toBe("19000000");
  });

  it("handles plain numbers", () => {
    expect(parseCurrency("1000")).toBe("1000");
    expect(parseCurrency("1234.56")).toBe("1234.56");
  });

  it("handles values with only decimal separator", () => {
    expect(parseCurrency("R1 000,")).toBe("1000");
    expect(parseCurrency("R1 234,5")).toBe("1234.5");
  });
});

