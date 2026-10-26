import { client } from "@/sanity/lib/client";

export type FishVariant = {
  _key: string;
  label: string;
  saleType: "piece" | "stack";
  fishCount: number;
  price: number;
  isAvailable?: boolean;
};

export type Fish = {
  _id: string;
  name: string;
  imageUrl?: string;
  videoUrl?: string;
  description?: string;
  variants: FishVariant[];
};

export async function getSanityFishes(): Promise<Fish[]> {
  try {
    const data = await client.fetch<Fish[]>(
      `*[_type == "fish"] | order(_createdAt desc) {
        _id, name,
        "imageUrl": coalesce(imageUrl, image.asset->url),
        videoUrl, description,
        variants[] { _key, label, saleType, fishCount, price, isAvailable }
      }`
    );
    return data ?? [];
  } catch (err) {
    console.error("Gagal mengambil data ikan dari Sanity:", err);
    return [];
  }
}