export const WA_NUMBER = "6281234567890"; // ganti dengan nomor toko (format 62...)

export type Category = "ikan" | "sayur" | "bumbu" | "pokok";

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  unit: string;
  note: string;
};

export const CATEGORIES: { key: Category; label: string; desc: string; color: string }[] = [
  { key: "ikan", label: "Ikan", desc: "Dibersihkan, siap masak", color: "var(--laut)" },
  { key: "sayur", label: "Sayur", desc: "Dipetik dua hari terakhir", color: "var(--daun)" },
  { key: "bumbu", label: "Bumbu", desc: "Cabai, bawang, rempah", color: "var(--cabai)" },
  { key: "pokok", label: "Sembako", desc: "Beras, minyak, telur, gula", color: "var(--kunyit-tua)" },
];

export const PRODUCTS: Product[] = [
  { id: "kembung", name: "Ikan kembung", category: "ikan", price: 38000, unit: "kg", note: "Isi 6–8 ekor per kg" },
  { id: "tongkol", name: "Ikan tongkol", category: "ikan", price: 32000, unit: "kg", note: "Bisa dipotong sesuai permintaan" },
  { id: "bandeng", name: "Ikan bandeng", category: "ikan", price: 35000, unit: "kg", note: "Duri bisa dicabut, tambah Rp3.000" },
  { id: "bayam", name: "Bayam", category: "sayur", price: 3000, unit: "ikat", note: "Satu ikat cukup untuk 3 orang" },
  { id: "kangkung", name: "Kangkung", category: "sayur", price: 3000, unit: "ikat", note: "Batang muda, tidak berserat" },
  { id: "tomat", name: "Tomat", category: "sayur", price: 14000, unit: "kg", note: "Merah matang, cocok untuk sambal" },
  { id: "wortel", name: "Wortel", category: "sayur", price: 16000, unit: "kg", note: "Tanpa daun, sudah dicuci" },
  { id: "rawit", name: "Cabai rawit merah", category: "bumbu", price: 70000, unit: "kg", note: "Bisa beli mulai 100 gram" },
  { id: "bawang-merah", name: "Bawang merah", category: "bumbu", price: 38000, unit: "kg", note: "Kering, umbi padat" },
  { id: "bawang-putih", name: "Bawang putih", category: "bumbu", price: 36000, unit: "kg", note: "Siung besar" },
  { id: "beras", name: "Beras premium", category: "pokok", price: 72000, unit: "5 kg", note: "Pulen, kemasan karung kecil" },
  { id: "minyak", name: "Minyak goreng", category: "pokok", price: 18000, unit: "liter", note: "Kemasan pouch" },
  { id: "telur", name: "Telur ayam", category: "pokok", price: 52000, unit: "30 butir", note: "Satu papan, ukuran sedang" },
  { id: "gula", name: "Gula pasir", category: "pokok", price: 18000, unit: "kg", note: "Putih bersih" },
];

// Papan harga di hero: ambil dari produk, tambahkan perubahan dari kemarin
export const PRICE_BOARD: { id: string; change: number }[] = [
  { id: "rawit", change: 3000 },
  { id: "kembung", change: 0 },
  { id: "bawang-merah", change: -2000 },
  { id: "tomat", change: -1000 },
  { id: "telur", change: 1000 },
];

export const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

export const waLink = (text: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
