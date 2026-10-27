"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
    CheckCircle2,
    Clock,
    MapPin,
    PackageCheck,
    RefreshCw,
    User,
} from "lucide-react";

import useTheme from "@/hooks/useTheme";
import { cn } from "@/utils";
import { formatTanggalIndonesia } from "@/utils/formatterDate";

interface HistoryItem {
    id: string;
    namaBarang: string;
    namaPelanggan?: string | null;
    jumlahBarang?: string | number | null;
    catatanBarang?: string | null;
    catatanPelanggan?: string | null;
    totalHarga?: string | number | null;
    alamat?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    kurirStatus?: string | null;
    bendaharaStatus: string | null;
    createdAt: string;
}

type FilterKey = "today" | "week" | "all";

const filters: { key: FilterKey; label: string }[] = [
    { key: "today", label: "Hari ini" },
    { key: "week", label: "7 hari" },

];

const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

const numberFormat = new Intl.NumberFormat("id-ID");

const toNumber = (value?: string | number | null): number => {
    if (value == null || value === "") return 0;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const jam = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });

const inRange = (iso: string, key: FilterKey): boolean => {
    if (key === "all") return true;

    const date = new Date(iso);
    const now = new Date();

    if (Number.isNaN(date.getTime())) return false;

    if (key === "today") {
        return date.toDateString() === now.toDateString();
    }

    const difference = now.getTime() - date.getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    return difference >= 0 && difference <= sevenDays;
};

export default function HistoryOrder() {
    const { getToken } = useAuth();
    const { isDark } = useTheme();

    const [orders, setOrders] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterKey>("today");

    const url = process.env.NEXT_PUBLIC_BACKEND_URL;

    const loadHistory = useCallback(async () => {
        if (!url) {
            setError("Alamat server belum diatur.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await getToken();

            if (!token) {
                throw new Error("Token 4autentikasi tidak tersedia.");
            }

            const response = await fetch(
                `${url.replace(/\/+$/, "")}/kurir/orderHistory`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'ngrok-skip-browser-warning': '1',
                        Accept: 'application/json',
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Gagal memuatsd riwayat: ${response.status}`);
            }

            const data: HistoryItem[] = await response.json();

            if (!Array.isArray(data)) {
                throw new Error("Format data riwayat tidak valid.");
            }

            setOrders(
                [...data].sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                ),
            );
        } catch (err) {
            console.error("Gagal memuat riwayat:", err);
            setError("Riwayat belum bisa dimuat. Periksa koneksi, lalu coba lagi.");
        } finally {
            setLoading(false);
        }
    }, [getToken, url]);

    useEffect(() => {
        void loadHistory();
    }, [loadHistory]);

    const visible = useMemo(
        () => orders.filter((order) => inRange(order.createdAt, filter)),
        [orders, filter],
    );

    const totalNilai = useMemo(
        () =>
            visible.reduce(
                (sum, order) => sum + toNumber(order.totalHarga),
                0,
            ),
        [visible],
    );

    const card = isDark
        ? "bg-zinc-900 ring-1 ring-zinc-800"
        : "bg-white ring-1 ring-emerald-100 shadow-sm shadow-emerald-900/5";

    const muted = isDark ? "text-zinc-400" : "text-zinc-500";

    return (
        <section aria-labelledby="judul-riwayat" className="space-y-4">
            <div>
                <h2 id="judul-riwayat" className="text-xl font-bold tracking-tight">
                    Riwayat pengantaran
                </h2>
                <p className={cn("text-sm", muted)}>
                    Pesanan yang sudah kamu antar sampai tujuan.
                </p>
            </div>

            {/* Ringkasan */}
            <div
                className={cn(
                    "grid grid-cols-2 divide-x rounded-2xl p-4",
                    card,
                    isDark ? "divide-zinc-800" : "divide-emerald-100",
                )}
            >
                <div className="pr-4">
                    <p className={cn("text-xs", muted)}>Jumlah pesanan</p>
                    <p className="mt-0.5 text-2xl font-bold">{visible.length}</p>
                </div>

                <div className="pl-4">
                    <p className={cn("text-xs", muted)}>Total nilai pesanan</p>
                    <p className="mt-0.5 truncate text-lg font-bold">
                        {rupiah.format(totalNilai)}
                    </p>
                </div>
            </div>

            {/* Filter waktu */}
            <div className="flex gap-2" role="group" aria-label="Filter waktu">
                {filters.map(({ key, label }) => (
                    <button
                        key={key}
                        type="button"
                        aria-pressed={filter === key}
                        onClick={() => setFilter(key)}
                        className={cn(
                            "h-10 flex-1 rounded-xl text-sm font-medium transition active:scale-[0.97]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                            filter === key
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                                : isDark
                                    ? "bg-zinc-900 text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-800"
                                    : "bg-white text-zinc-600 ring-1 ring-emerald-100 hover:bg-emerald-50",
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <ul
                    className="space-y-3"
                    aria-busy="true"
                    aria-label="Memuat riwayat"
                >
                    {[0, 1, 2].map((i) => (
                        <li key={i} className={cn("h-32 animate-pulse rounded-2xl", card)} />
                    ))}
                </ul>
            )}

            {/* Error */}
            {!loading && error && (
                <div
                    role="alert"
                    className={cn(
                        "flex flex-col items-center gap-3 rounded-2xl p-6 text-center",
                        card,
                    )}
                >
                    <p className="text-sm">{error}</p>

                    <button
                        type="button"
                        onClick={() => void loadHistory()}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition active:scale-95"
                    >
                        <RefreshCw size={16} />
                        Coba lagi
                    </button>
                </div>
            )}

            {/* Kosong */}
            {!loading && !error && visible.length === 0 && (
                <div
                    className={cn(
                        "flex flex-col items-center gap-2 rounded-2xl px-6 py-10 text-center",
                        card,
                    )}
                >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                        <PackageCheck size={24} />
                    </span>

                    <p className="font-semibold">Belum ada pesanan</p>

                    <p className={cn("text-sm", muted)}>
                        {filter === "all"
                            ? "Pesanan akan muncul di sini jika tersedia."
                            : "Coba pilih rentang waktu yang lebih panjang."}
                    </p>
                </div>
            )}

            {/* Daftar */}
            {!loading && !error && visible.length > 0 && (
                <ul className="space-y-3">
                    {visible.map((order) => (
                        <li key={order.id} className={cn("rounded-2xl p-4", card)}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate font-semibold">{order.namaBarang}</p>
                                    <p className={cn("mt-1 text-xs", muted)}>
                                        ID: {order.id}
                                    </p>
                                </div>

                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                                    <CheckCircle2 size={13} />
                                    {order.kurirStatus ?? "Selesai"}
                                </span>

                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                                    <CheckCircle2 size={13} />
                                    {order.bendaharaStatus ?? "Selesai"}
                                </span>
                            </div>

                            <div className={cn("mt-3 space-y-2 text-sm", muted)}>
                                <p className="flex items-center gap-2">
                                    <User size={15} className="shrink-0" />
                                    <span className="truncate">
                                        {order.namaPelanggan || "Nama pelanggan tidak tersedia"}
                                    </span>
                                </p>

                                <p className="flex items-start gap-2">
                                    <MapPin size={15} className="mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">
                                        {order.alamat || "Alamat tidak tersedia"}
                                    </span>
                                </p>

                                {order.catatanBarang && (
                                    <p>Catatan barang: {order.catatanBarang}</p>
                                )}

                                {order.catatanPelanggan && (
                                    <p>Catatan pelanggan: {order.catatanPelanggan}</p>
                                )}
                            </div>

                            <div
                                className={cn(
                                    "mt-3 flex items-end justify-between gap-3 border-t pt-3",
                                    isDark ? "border-zinc-800" : "border-emerald-100",
                                )}
                            >
                                <p className={cn("flex items-center gap-1.5 text-xs", muted)}>
                                    <Clock size={13} className="shrink-0" />
                                    {formatTanggalIndonesia(new Date(order.createdAt))},{" "}
                                    {jam(order.createdAt)}
                                </p>

                                <div className="shrink-0 text-right">
                                    <p className="font-bold">
                                        {rupiah.format(toNumber(order.totalHarga))}
                                    </p>
                                    <p className={cn("text-xs", muted)}>
                                        {numberFormat.format(toNumber(order.jumlahBarang))} barang
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}