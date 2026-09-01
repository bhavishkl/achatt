import type { Bill } from "@/types/patient";
import type { BillDraftItem } from "@/components/add-bill-modal/types";

export function createItemId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function extractPackages(services: any[]) {
  const prefixCounts = new Map<string, any[]>();
  const serviceWords = services.map(s => ({
    service: s,
    words: (s.name || "").trim().split(/\s+/)
  }));

  for (const {service, words} of serviceWords) {
    for (let i = 1; i <= words.length - 1; i++) {
      const prefix = words.slice(0, i).join(' ');
      if (!prefixCounts.has(prefix)) {
        prefixCounts.set(prefix, []);
      }
      prefixCounts.get(prefix)!.push(service);
    }
  }

  const validPrefixes = Array.from(prefixCounts.entries())
    .filter(([_, items]) => items.length > 1);

  const packages = [];
  for (let i = 0; i < validPrefixes.length; i++) {
    const [prefixA, itemsA] = validPrefixes[i];
    let isSubsumed = false;
    for (let j = 0; j < validPrefixes.length; j++) {
      if (i === j) continue;
      const [prefixB, itemsB] = validPrefixes[j];
      if (prefixB.startsWith(prefixA + ' ') && itemsA.length === itemsB.length) {
        const idsA = itemsA.map(it => it.id).sort().join(',');
        const idsB = itemsB.map(it => it.id).sort().join(',');
        if (idsA === idsB) {
          isSubsumed = true;
          break;
        }
      }
    }
    if (!isSubsumed) {
      packages.push({
        id: prefixA,
        name: `${prefixA} Package`,
        wardKeywords: [prefixA.toLowerCase(), prefixA.toLowerCase().replace(/\s+/g, ''), prefixA.toLowerCase().replace(/\s+/g, '-')],
        items: itemsA
      });
    }
  }
  return packages;
}

export function getPackageByWard(wardName: string, packages: any[]) {
  if (!wardName) return null;
  const normalizedWard = wardName.toLowerCase();
  return packages.find((pkg) =>
    pkg.wardKeywords.some((keyword: string) => normalizedWard.includes(keyword))
  );
}

export function getStoredUserId() {
  return sessionStorage.getItem("userId") ?? localStorage.getItem("userId") ?? null;
}

export function toDraftItemsFromBill(existingBill: Bill | null | undefined): BillDraftItem[] {
  if (!existingBill || existingBill.items.length === 0) {
    return [];
  }

  return existingBill.items.map((item) => ({
    id: item.id,
    description: item.description,
    rate: item.rate,
    quantity: item.quantity,
  }));
}

export function calculateTotal(items: BillDraftItem[]) {
  return items.reduce((sum, item) => sum + item.rate * item.quantity, 0);
}

export function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr.trim() === "" || dateStr === "-") return "-";
  const clean = dateStr.trim().split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else if (parts[2].length === 4) {
      // Already DD-MM-YYYY
      return clean;
    }
  }
  return dateStr;
}

export function amountToWords(num: number): string {
  if (isNaN(num) || num < 0) return "";
  if (num === 0) return "Rupees Zero Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? " " + ones[unit] : "");
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = "";
    if (hundred > 0) {
      str += ones[hundred] + " Hundred";
      if (rest > 0) str += " ";
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str;
  }

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = "";

  const crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundred = remainder;

  if (crore > 0) {
    result += convertTwoDigits(crore) + " Crore ";
  }
  if (lakh > 0) {
    result += convertTwoDigits(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    result += convertTwoDigits(thousand) + " Thousand ";
  }
  if (hundred > 0) {
    result += convertThreeDigits(hundred) + " ";
  }

  result = result.trim();
  if (result === "") {
    result = "Zero";
  }

  let words = "Rupees " + result;

  if (decimalPart > 0) {
    words += " and " + convertTwoDigits(decimalPart) + " Paise";
  }

  words += " Only";
  return words;
}
