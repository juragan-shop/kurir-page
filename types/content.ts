export type Fish = {
    _id: string;
    name: string;
    category?: string;
    description?: string;
    price: number;
    image?: {
        _type: "image";
        asset: {
            _ref: string;
            _type: "reference";
        };
        crop?: unknown;
        hotspot?: unknown;
    };
};

export type FishCardProps = {
    fish: Fish;
};

export interface Order {
    id: string;
    namaBarang: string;
    catatanBarang?: string | null;
    jumlahBarang?: string | number;
    catatanPelanggan? : string | null
    hargaBarang?: string | null;
    totalHarga?: string | null;
}

export type Decision = "APPROVED" | "REJECTED";