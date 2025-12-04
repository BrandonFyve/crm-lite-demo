"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency, parseCurrency } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: string;
  onChange: (value: string) => void;
  showPrefix?: boolean;
  showDecimals?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder,
  className,
  showPrefix = true,
  showDecimals = true,
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(
    value ? formatCurrency(value, showPrefix, showDecimals) : ""
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value ? formatCurrency(value, showPrefix, showDecimals) : "");
    }
  }, [value, isFocused, showPrefix, showDecimals]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      className={className}
      value={isFocused ? value : displayValue}
      onChange={(e) => {
        const rawValue = parseCurrency(e.target.value);
        onChange(rawValue);
        setDisplayValue(e.target.value);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        const parsed = parseCurrency(e.target.value);
        const formatted = formatCurrency(parsed, showPrefix, showDecimals);
        setDisplayValue(formatted);
        onChange(parsed);
      }}
      onFocus={() => {
        setIsFocused(true);
        setDisplayValue(value || "");
      }}
      {...props}
    />
  );
}

