import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("formatCurrency", () => {
  it("formats positive numbers", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large numbers", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });
});

describe("formatNumber", () => {
  it("formats numbers with commas", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("formats small numbers", () => {
    expect(formatNumber(42)).toBe("42");
  });
});

describe("formatPercentage", () => {
  it("formats percentages", () => {
    expect(formatPercentage(50)).toBe("50.0%");
  });

  it("formats decimal percentages", () => {
    expect(formatPercentage(3.14)).toBe("3.1%");
  });
});

describe("formatDate", () => {
  it("formats date strings", () => {
    const date = "2024-01-15T10:30:00Z";
    const formatted = formatDate(date);
    expect(formatted).toContain("Jan");
    expect(formatted).toContain("15");
    expect(formatted).toContain("2024");
  });

  it("formats Date objects", () => {
    const date = new Date(2024, 5, 20); // June 20, 2024
    const formatted = formatDate(date);
    expect(formatted).toContain("Jun");
    expect(formatted).toContain("20");
  });
});
