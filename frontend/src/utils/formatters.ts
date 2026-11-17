import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return "0 ₫";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (val: number | string | undefined | null, decimals: number = 0): string => {
  if (val === undefined || val === null) return "0";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return "-";
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
    return format(d, "dd/MM/yyyy", { locale: vi });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return "-";
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
    return format(d, "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return dateStr;
  }
};

