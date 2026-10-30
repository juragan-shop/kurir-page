"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import {
    Check,
    CheckCircle2,
    Copy,
    Loader2,
    MapPin,
    MapPinOff,
    Navigation,
    Package,
    PackageOpen,
    StickyNote,
    Truck,
    User,
} from "lucide-react";

import useTheme from "@/hooks/useTheme";
import { cn } from "@/utils";

/* ------------------------------ Types ------------------------------ */

// Satu order = satu pelanggan = banyak barang (orderItems), sesuai skema.
type KurirItem = {
    id: string;
    namaBarang: string;
    jumlahBarang: number;
    catatanBarang: string | null;
    catatanPelanggan: string | null;
};

type KurirOrder = {
    id: string;
    namaPelanggan: string | null;
    alamatPelanggan: string | null;
    totalHarga: number; 
    ongkir: number;
    latitude: number | null;
    longitude: number | null;
    kurirStatus: string;
    orderItems: KurirItem[];
};



const toText = (v: unknown) => (v == null || v === "" ? null : String(v));

const toCoord = (value: unknown, limit: number): number | null => {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
};

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

/** Ubah data dari backend menjadi KurirOrder.
 *  Koordinat dibaca dari order, atau dari data pelanggan (relasi user) kalau ada di situ. */
function normalizeOrders(payload: unknown): KurirOrder[] {
    const p = payload as { orders?: unknown[]; data?: unknown[] } | null;
    const raw = Array.isArray(payload) ? payload : (p?.orders ?? p?.data ?? []);

    return (raw as Record<string, unknown>[]).map((o) => {
        const user = (o.user ?? o.pelanggan ?? {}) as Record<string, unknown>;
        const items = Array.isArray(o.orderItems)
            ? (o.orderItems as Record<string, unknown>[])
            : [];

        return {
            id: String(o.id),
            namaPelanggan: toText(o.namaPelanggan),
            alamatPelanggan: toText(o.alamatPelanggan ?? user.alamat),
            totalHarga: Number(o.totalHarga ?? 0) || 0,
            ongkir: Number(o.ongkir ?? 0) || 0,
            latitude: toCoord(o.latitude ?? user.latitude, 90),
            longitude: toCoord(o.longitude ?? user.longitude, 180),
            kurirStatus: String(o.kurirStatus ?? "PENDING"),
            orderItems: items.map((i) => ({
                id: String(i.id),
                namaBarang: String(i.namaBarang ?? ""),
                jumlahBarang: Number(i.jumlahBarang ?? 0) || 0,
                catatanBarang: toText(i.catatanBarang),
                catatanPelanggan: toText(i.catatanPelanggan),
            })),
        };
    });
}

/** Catatan pelanggan dari semua barang (unik, tanpa yang kosong). */
const getCustomerNotes = (items: KurirItem[]) =>
    Array.from(
        new Set(
            items
                .map((i) => i.catatanPelanggan?.trim())
                .filter((n): n is string => Boolean(n)),
        ),
    );


const buildNavigationUrl = (order: KurirOrder): string | null => {
  if (order.latitude != null && order.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}&travelmode=driving`;
  }

  if (order.alamatPelanggan) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      order.alamatPelanggan,
    )}&travelmode=driving`;
  }

  return null;
};

/* ---------------------------- Component ---------------------------- */

export default function ConfirmOrder() {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL;
    const { getToken, isLoaded } = useAuth();
    const { isDark } = useTheme();

    const [orders, setOrders] = useState<KurirOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    /* ------------------------------ API ------------------------------ */

    const getAuthToken = useCallback(async () => {
        const token = await getToken();
        if (!token) throw new Error("Token autentikasi tidak tersedia. Silakan login kembali.");
        return token;
    }, [getToken]);

    const fetchOrders = useCallback(async () => {
        if (!url) throw new Error("URL backend belum dikonfigurasi");

        const token = await getAuthToken();

        const response = await fetch(`${url}/kurir/orders`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "ngrok-skip-browser-warning": "1",
                Accept: "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const result = await response.json().catch(() => null);
            throw new Error(
                result?.message ?? `Gagal mengambil pesanan: HTTP ${response.status}`,
            );
        }

        const data = await response.json();

        // Yang tampil: pesanan yang belum dikonfirmasi kurir
        setOrders(normalizeOrders(data).filter((o) => o.kurirStatus !== "APPROVED"));
    }, [url, getAuthToken]);

    useEffect(() => {
        if (!isLoaded) return;

        fetchOrders()
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Gagal mengambil pesanan");
            })
            .finally(() => setLoading(false));
    }, [isLoaded, fetchOrders]);

    const handleConfirm = async (id: string) => {
        if (!url) {
            setError("URL backend belum dikonfigurasi.");
            return;
        }

        setError("");
        setMessage("");
        setSubmittingId(id);

        try {
            const token = await getAuthToken();

            const response = await fetch(`${url}/kurir/updateOrder/${id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ kurirStatus: "APPROVED" }),
            });

            if (!response.ok) {
                const result = await response.json().catch(() => null);
                throw new Error(
                    result?.message ?? `Gagal mengonfirmasi pesanan: HTTP ${response.status}`,
                );
            }

            setOrders((current) => current.filter((o) => o.id !== id));
            setMessage("Pesanan berhasil dikonfirmasi.");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setSubmittingId(null);
        }
    };

    const handleCopy = async (order: KurirOrder) => {
        if (order.latitude === null || order.longitude === null) return;

        try {
            await navigator.clipboard.writeText(`${order.latitude}, ${order.longitude}`);
            setCopiedId(order.id);
            setTimeout(() => setCopiedId(null), 1800);
        } catch {
            setError("Koordinat gagal disalin.");
        }
    };

    /* ------------------------------ Style ------------------------------ */

    const card = cn(
        "rounded-2xl border transition-all duration-300",
        isDark
            ? "border-white/10 bg-neutral-900/80"
            : "border-slate-200 bg-white shadow-sm shadow-blue-900/5",
    );
    const muted = isDark ? "text-neutral-400" : "text-slate-500";
    const tile = cn("rounded-xl p-3", isDark ? "bg-white/5" : "bg-slate-50");

    /* ------------------------------ Loading ------------------------------ */

    if (!isLoaded || loading) {
        return (
            <section className="mx-auto w-full max-w-2xl space-y-4 p-4 sm:p-6">
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        className={cn(card, "h-64 animate-pulse", isDark ? "bg-white/5" : "bg-blue-50")}
                    />
                ))}
            </section>
        );
    }

    /* ------------------------------ Render ------------------------------ */

    return (
        <section className="mx-auto w-full space-y-5 p-4 sm:p-6">
            {/* Header */}
            <div
                className={cn(
                    "flex items-center gap-4 rounded-3xl p-5 text-white sm:p-6",
                    "bg-gradient-to-br from-blue-800 via-blue-600 to-sky-500",
                    "shadow-xl shadow-blue-600/30",
                )}
            >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                    <Truck size={24} />
                </span>

                <div className="min-w-0 flex-1 space-y-0.5">
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                        Konfirmasi Pesanan
                    </h1>
                    <p className="text-sm text-white/80">
                        Cek titik antar, navigasi ke lokasi, lalu konfirmasi.
                    </p>
                </div>

                <span className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur-sm">
                    {orders.length}
                </span>
            </div>

            {/* Alerts */}
            {error && (
                <p
                    role="alert"
                    className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-600"
                >
                    {error}
                </p>
            )}

            {message && (
                <p
                    role="status"
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-600"
                >
                    {message}
                </p>
            )}

            {/* List */}
            {orders.length === 0 ? (
                <div className={cn(card, "flex flex-col items-center gap-3 p-10 text-center")}>
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                        <PackageOpen size={28} />
                    </span>
                    <p className={muted}>Tidak ada pesanan yang menunggu konfirmasimu.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const hasCoord = order.latitude !== null && order.longitude !== null;
                        const navUrl = buildNavigationUrl(order);
                        const isSubmitting = submittingId === order.id;

                        const items = order.orderItems;
                        const totalQty = items.reduce((sum, i) => sum + i.jumlahBarang, 0);
                        const grandTotal = order.totalHarga + order.ongkir;
                        const customerNotes = getCustomerNotes(items);

                        return (
                            <article
                                key={order.id}
                                className={cn(card, "relative space-y-4 overflow-hidden p-5 pl-6")}
                            >
                                <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-600 to-sky-400" />

                                {/* Pelanggan + status */}
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold">
                                        <User size={18} className="shrink-0 text-blue-600" />
                                        <span className="truncate">
                                            {order.namaPelanggan ?? "Pelanggan tanpa nama"}
                                        </span>
                                    </h2>

                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 ring-1 ring-amber-500/30">
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                        Menunggu konfirmasi
                                    </span>
                                </div>

                                {/* Daftar barang */}
                                <div className="space-y-2">
                                    <p className="flex items-center gap-2 text-sm font-semibold">
                                        <Package size={16} className="text-blue-600" />
                                        Barang yang diantar ({items.length})
                                    </p>

                                    {items.length === 0 ? (
                                        <p className={cn("text-sm", muted)}>Pesanan ini tidak punya barang.</p>
                                    ) : (
                                        <ul
                                            className={cn(
                                                "divide-y rounded-xl border",
                                                isDark ? "divide-white/10 border-white/10" : "divide-slate-200 border-slate-200",
                                            )}
                                        >
                                            {items.map((item) => (
                                                <li key={item.id} className="space-y-0.5 p-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <span className="text-sm font-medium">{item.namaBarang}</span>
                                                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                                                            × {item.jumlahBarang}
                                                        </span>
                                                    </div>
                                                    {item.catatanBarang && (
                                                        <p className={cn("text-xs", muted)}>
                                                            Catatan: {item.catatanBarang}
                                                        </p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Ringkasan */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={tile}>
                                        <p className={cn("text-xs", muted)}>Jumlah barang</p>
                                        <p className="mt-0.5 font-medium">{totalQty}</p>
                                    </div>
                                    <div className={tile}>
                                        <p className={cn("text-xs", muted)}>Total harga</p>
                                        <p className="mt-0.5 font-semibold text-blue-600">
                                            {formatRupiah(grandTotal)}
                                        </p>
                                        <p className={cn("text-[11px]", muted)}>
                                            Barang {formatRupiah(order.totalHarga)} + ongkir {formatRupiah(order.ongkir)}
                                        </p>
                                    </div>
                                </div>

                                {/* Titik antar */}
                                <div
                                    className={cn(
                                        "space-y-3 rounded-2xl p-4",
                                        isDark
                                            ? "bg-blue-500/10 ring-1 ring-blue-400/20"
                                            : "bg-blue-50 ring-1 ring-blue-100",
                                    )}
                                >
                                    <p className="flex items-center gap-2 text-sm font-semibold">
                                        {hasCoord ? (
                                            <MapPin size={16} className="text-blue-600" />
                                        ) : (
                                            <MapPinOff size={16} className="text-amber-500" />
                                        )}
                                        Titik antar
                                    </p>

                                    {order.alamatPelanggan && (
                                        <p className={cn("text-sm", muted)}>{order.alamatPelanggan}</p>
                                    )}

                                    {hasCoord ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className={cn("rounded-xl p-3", isDark ? "bg-white/5" : "bg-white")}>
                                                <p className={cn("text-[11px]", muted)}>Latitude</p>
                                                <p className="font-mono text-sm">{order.latitude!.toFixed(6)}</p>
                                            </div>
                                            <div className={cn("rounded-xl p-3", isDark ? "bg-white/5" : "bg-white")}>
                                                <p className={cn("text-[11px]", muted)}>Longitude</p>
                                                <p className="font-mono text-sm">{order.longitude!.toFixed(6)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-amber-600">
                                            Koordinat belum tersedia. Navigasi akan menggunakan alamat teks.
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {navUrl ? (
                                            <a
                                                href={navUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={cn(
                                                    "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4",
                                                    "bg-gradient-to-r from-blue-700 to-blue-500 text-sm font-semibold text-white",
                                                    "shadow-md shadow-blue-600/30 transition-all duration-200",
                                                    "hover:brightness-110 active:scale-95",
                                                )}
                                            >
                                                <Navigation size={17} />
                                                Navigasi di Google Maps
                                            </a>
                                        ) : (
                                            <span
                                                className={cn(
                                                    "inline-flex h-12 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold opacity-60",
                                                    isDark ? "bg-white/10" : "bg-slate-200 text-slate-500",
                                                )}
                                            >
                                                <MapPinOff size={17} />
                                                Alamat belum tersedia
                                            </span>
                                        )}

                                        {hasCoord && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(order)}
                                                className={cn(
                                                    "inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4",
                                                    "text-sm font-medium transition-all duration-200 active:scale-95",
                                                    isDark
                                                        ? "border-white/15 hover:bg-white/10"
                                                        : "border-blue-200 bg-white text-blue-700 hover:bg-blue-50",
                                                )}
                                            >
                                                {copiedId === order.id ? (
                                                    <>
                                                        <Check size={16} className="text-emerald-500" />
                                                        Tersalin
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={16} />
                                                        Salin
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Catatan pelanggan */}
                                {customerNotes.length > 0 && (
                                    <div className={cn(tile, "space-y-2 text-sm")}>
                                        {customerNotes.map((note) => (
                                            <p key={note} className="flex items-start gap-2.5">
                                                <StickyNote size={15} className="mt-0.5 shrink-0 text-blue-500" />
                                                <span>
                                                    <span className={cn("text-xs", muted)}>Pelanggan: </span>
                                                    {note}
                                                </span>
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* Konfirmasi */}
                                <button
                                    type="button"
                                    disabled={submittingId !== null}
                                    onClick={() => handleConfirm(order.id)}
                                    className={cn(
                                        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl",
                                        "bg-gradient-to-r from-emerald-600 to-teal-500 text-sm font-semibold text-white",
                                        "shadow-md shadow-emerald-500/30 transition-all duration-200",
                                        "hover:brightness-110 active:scale-[0.98] disabled:opacity-50",
                                    )}
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={17} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={17} />
                                    )}
                                    {isSubmitting ? "Memproses..." : "Konfirmasi Pesanan"}
                                </button>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}