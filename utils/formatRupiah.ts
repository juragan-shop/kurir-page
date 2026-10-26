export const formatRupiah = (value: string | bigint) => {
  const amount = BigInt(value);
  const isNegative = amount < BigInt(0);
  const absoluteAmount = isNegative
    ? BigInt(0) - amount
    : amount;

  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(absoluteAmount);

  return `${isNegative ? "- " : ""}Rp${formatted}`;
};