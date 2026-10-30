"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    ListChecks,
    Loader2,
    MapPin,
    Navigation,
    Package,
    StickyNote,
} from "lucide-react";

import useTheme from "@/hooks/useTheme";
import { cn } from "@/utils";

/* ------------------------------ Types ------------------------------ */

// Satu order = satu pelanggan = banyak barang (sesuai skema).
type TugasItem = {
    id: string;
    namaBarang: string;
    jumlahBarang: number;
    catatanBarang: string | null;
    catatanPelanggan: string | null;
};

type Tugas = {
    id: string;
    namaPelanggan: string | null;
    alamat: string | null;
    latitude: number | null;
    longitude: number | null;
    totalHarga: number;
    ongkir: number;
    // PENDING = belum diantar, APPROVED = selesai
    kurirStatus: string;
    orderItems: TugasItem[];
};

/* ----------------------------- Helpers ----------------------------- */

const toText = (v: unknown) => (v == null || v === "" ? null : String(v));

const toCoord = (value: unknown, limit: number): number | null => {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
};

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

/** Ubah data dari backend (GET /kurir/orders) menjadi Tugas.
 *  Koordinat dan alamat dibaca dari order, atau dari data pelanggan (relasi user). */
function normalizeTugas(payload: unknown): Tugas[] {
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
            alamat: toText(o.alamatPelanggan ?? user.alamat),
            latitude: toCoord(o.latitude ?? user.latitude, 90),
            longitude: toCoord(o.longitude ?? user.longitude, 180),
            totalHarga: Number(o.totalHarga ?? 0) || 0,
            ongkir: Number(o.ongkir ?? 0) || 0,
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

const isSelesai = (t: Tugas) => t.kurirStatus === "APPROVED";

/** Catatan pelanggan dari semua barang (unik, tanpa yang kosong). */
const getCustomerNotes = (items: TugasItem[]) =>
    Array.from(
        new Set(
            items
                .map((i) => i.catatanPelanggan?.trim())
                .filter((n): n is string => Boolean(n)),
        ),
    );

/** Link navigasi Google Maps: pakai koordinat kalau ada, kalau tidak pakai alamat teks. */
const mapsUrl = (t: Tugas): string | null => {
    if (t.latitude !== null && t.longitude !== null) {
        return `https://www.google.com/maps/dir/?api=1&destination=${t.latitude},${t.longitude}&travelmode=driving`;
    }
    if (t.alamat) {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(t.alamat)}&travelmode=driving`;
    }
    return null;
};

/* ---------------------------- Component ---------------------------- */

export default function KurirHome() {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL;
    const { isDark } = useTheme();
    const { user } = useUser();
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const [tugas, setTugas] = useState<Tugas[]>([]);
    const [loading, setLoading] = useState(true);
    const [finishingId, setFinishingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const nama =
        user?.firstName ??
        (user?.unsafeMetadata?.nama as string | undefined) ??
        "Kurir";

    /* ------------------------------ API ------------------------------ */

    const getAuthToken = useCallback(async () => {
        const token = await getToken();
        if (!token) throw new Error("Sesi login habis. Silakan login kembali.");
        return token;
    }, [getToken]);

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setLoading(false);
            setLoadFailed(true);
            setError("Silakan login untuk melihat tugasmu.");
            return;
        }

        let cancelled = false;

        async function fetchTugas() {
            try {
                setLoading(true);
                setError(null);
                setLoadFailed(false);

                if (!url) throw new Error("URL backend belum dikonfigurasi.");

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

                const payload = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(
                        payload?.message ?? `Gagal mengambil tugas: HTTP ${response.status}`,
                    );
                }

                if (!cancelled) setTugas(normalizeTugas(payload));
            } catch (err) {
                if (!cancelled) {
                    setLoadFailed(true);
                    setError(
                        err instanceof TypeError
                            ? "Periksa koneksi internet Anda."
                            : err instanceof Error
                                ? err.message
                                : "Gagal mengambil tugas.",
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void fetchTugas();

        return () => {
            cancelled = true;
        };
    }, [isLoaded, isSignedIn, url, getAuthToken, reloadKey]);

    const tandaiSelesai = async (id: string) => {
        if (finishingId) return;

        setFinishingId(id);
        setError(null);

        try {
            if (!url) throw new Error("URL backend belum dikonfigurasi.");

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
                    result?.message ?? `Gagal menyimpan: HTTP ${response.status}`,
                );
            }

            setTugas((current) =>
                current.map((t) => (t.id === id ? { ...t, kurirStatus: "APPROVED" } : t)),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Gagal menyimpan. Periksa koneksi lalu coba lagi.",
            );
        } finally {
            setFinishingId(null);
        }
    };

    /* ------------------------------ Data ------------------------------ */

    const { pending, selesai } = useMemo(
        () => ({
            pending: tugas.filter((t) => !isSelesai(t)),
            selesai: tugas.filter(isSelesai),
        }),
        [tugas],
    );

    /* ------------------------------ Styles ------------------------------ */

    const card = cn(
        "rounded-2xl border transition-all duration-300",
        isDark
            ? "border-white/10 bg-zinc-900/80"
            : "border-emerald-100 bg-white shadow-sm shadow-emerald-900/5",
    );
    const muted = isDark ? "text-zinc-400" : "text-zinc-500";
    const tile = isDark ? "bg-white/5" : "bg-emerald-50/70";
    const accentText = isDark ? "text-emerald-400" : "text-emerald-700";

    const stats = [
        { label: "Menunggu", value: pending.length, Icon: Clock, color: "from-amber-500 to-orange-400" },
        { label: "Selesai", value: selesai.length, Icon: CheckCircle2, color: "from-emerald-600 to-lime-400" },
        { label: "Total", value: tugas.length, Icon: ListChecks, color: "from-teal-600 to-emerald-400" },
    ];

    /* ------------------------------ Loading ------------------------------ */

    if (!isLoaded || loading) {
        return (
            <section className="mx-auto w-full space-y-5">
                <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className={cn(card, "h-24 animate-pulse", isDark ? "bg-white/5" : "bg-emerald-50")}
                        />
                    ))}
                </div>
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        className={cn(card, "h-56 animate-pulse", isDark ? "bg-white/5" : "bg-emerald-50")}
                    />
                ))}
            </section>
        );
    }

    /* -------------------------------- UI -------------------------------- */

    return (
        <section className="mx-auto w-full space-y-5">
            {/* Sapaan */}
            <div className="px-1">
                <h1 className="text-xl font-bold tracking-tight">Halo, {nama}!</h1>
                <p className={cn("text-sm", muted)}>
                    {pending.length > 0
                        ? `Ada ${pending.length} pengantaran. Pilih mana yang mau kamu antar dulu.`
                        : "Tidak ada pengantaran yang menunggu saat ini."}
                </p>
            </div>

            {/* Banner error */}
            {error && (
                <div
                    role="alert"
                    className={cn(
                        "flex flex-wrap items-center gap-3 rounded-2xl border p-4 text-sm",
                        isDark
                            ? "border-red-400/30 bg-red-500/10 text-red-200"
                            : "border-red-200 bg-red-50 text-red-700",
                    )}
                >
                    <AlertCircle size={18} className="shrink-0" />
                    <span className="min-w-0 flex-1">{error}</span>
                    {loadFailed && isSignedIn && (
                        <button
                            type="button"
                            onClick={() => setReloadKey((k) => k + 1)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 active:scale-95"
                        >
                            Coba lagi
                        </button>
                    )}
                </div>
            )}

            {/* Statistik */}
            <div className="grid grid-cols-3 gap-3">
                {stats.map(({ label, value, Icon, color }) => (
                    <article
                        key={label}
                        className={cn(card, "p-3.5 hover:-translate-y-0.5 hover:shadow-md")}
                    >
                        <span
                            className={cn(
                                "mb-3 flex h-9 w-9 items-center justify-center rounded-xl",
                                "bg-gradient-to-br text-white shadow-md",
                                color,
                            )}
                        >
                            <Icon size={17} />
                        </span>
                        <p className="text-2xl font-bold leading-none">{value}</p>
                        <p className={cn("mt-1 text-xs", muted)}>{label}</p>
                    </article>
                ))}
            </div>

            {/* Daftar pengantaran (semua sama, kurir bebas memilih) */}
            {pending.length === 0 ? (
                <div className={cn(card, "flex flex-col items-center gap-3 p-10 text-center")}>
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                        <CheckCircle2 size={28} />
                    </span>
                    <div>
                        <p className="font-semibold">
                            {tugas.length === 0 ? "Belum ada tugas" : "Semua tugas selesai"}
                        </p>
                        <p className={cn("text-sm", muted)}>
                            {tugas.length === 0
                                ? "Pesanan yang ditugaskan padamu akan muncul di sini."
                                : "Tidak ada pengantaran yang menunggu saat ini."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <h2 className="flex items-center justify-between px-1 text-sm font-semibold">
                        Menunggu diantar
                        <span className={cn("text-xs font-normal", muted)}>
                            {pending.length} tugas
                        </span>
                    </h2>

                    {pending.map((t) => {
                        const items = t.orderItems;
                        const notes = getCustomerNotes(items);
                        const navUrl = mapsUrl(t);
                        const isFinishing = finishingId === t.id;

                        return (
                            <article
                                key={t.id}
                                className={cn(card, "relative space-y-4 overflow-hidden p-5 pl-6")}
                            >
                                <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-600 to-lime-400" />

                                {/* Pelanggan */}
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-lime-400 text-lg font-bold text-white">
                                        {(t.namaPelanggan ?? "?").charAt(0).toUpperCase()}
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className="truncate text-lg font-semibold">
                                            {t.namaPelanggan ?? "Pelanggan tanpa nama"}
                                        </h3>
                                        <p className={cn("flex items-center gap-1.5 text-sm", muted)}>
                                            <Package size={14} />
                                            {items.length} jenis barang · total {formatRupiah(t.totalHarga + t.ongkir)}
                                        </p>
                                    </div>
                                </div>

                                {/* Barang */}
                                {items.length > 0 && (
                                    <ul
                                        className={cn(
                                            "divide-y rounded-xl border text-sm",
                                            isDark ? "divide-white/10 border-white/10" : "divide-emerald-100 border-emerald-100",
                                        )}
                                    >
                                        {items.map((item) => (
                                            <li key={item.id} className="space-y-0.5 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <span className="font-medium">{item.namaBarang}</span>
                                                    <span className="shrink-0 font-semibold tabular-nums">
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

                                {/* Alamat + catatan pelanggan */}
                                <div className={cn("space-y-3 rounded-xl p-3.5 text-sm", tile)}>
                                    <p className="flex items-start gap-2.5">
                                        <MapPin size={16} className={cn("mt-0.5 shrink-0", accentText)} />
                                        <span>{t.alamat ?? "Alamat belum tersedia"}</span>
                                    </p>

                                    {notes.map((note) => (
                                        <p key={note} className="flex items-start gap-2.5">
                                            <StickyNote size={16} className="mt-0.5 shrink-0 text-amber-500" />
                                            <span className={muted}>{note}</span>
                                        </p>
                                    ))}
                                </div>

                                {/* Aksi */}
                                <div className="grid grid-cols-2 gap-3">
                                    {navUrl ? (
                                        <a
                                            href={navUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(
                                                "inline-flex h-12 items-center justify-center gap-2 rounded-xl border",
                                                "text-sm font-semibold transition-all duration-200 active:scale-95",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                                                isDark
                                                    ? "border-white/15 hover:bg-white/10"
                                                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
                                            )}
                                        >
                                            <Navigation size={16} />
                                            Navigasi
                                        </a>
                                    ) : (
                                        <span
                                            className={cn(
                                                "inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-xl border text-sm font-semibold opacity-50",
                                                isDark ? "border-white/15" : "border-emerald-200",
                                            )}
                                        >
                                            <Navigation size={16} />
                                            Tanpa alamat
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        disabled={finishingId !== null}
                                        onClick={() => tandaiSelesai(t.id)}
                                        className={cn(
                                            "inline-flex h-12 items-center justify-center gap-2 rounded-xl",
                                            "bg-gradient-to-r from-emerald-600 to-emerald-500 text-sm font-semibold text-white",
                                            "shadow-md shadow-emerald-500/30 transition-all duration-200",
                                            "hover:brightness-110 active:scale-95 disabled:opacity-60",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
                                        )}
                                    >
                                        {isFinishing ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <CheckCircle2 size={16} />
                                        )}
                                        {isFinishing ? "Menyimpan..." : "Tandai selesai"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Sudah selesai */}
            {selesai.length > 0 && (
                <div className="space-y-3">
                    <h2 className="flex items-center justify-between px-1 text-sm font-semibold">
                        Sudah selesai
                        <span className={cn("text-xs font-normal", muted)}>
                            {selesai.length} tugas
                        </span>
                    </h2>

                    {selesai.map((t) => (
                        <article
                            key={t.id}
                            className={cn(card, "flex items-center gap-3 p-4 opacity-75")}
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                                <CheckCircle2 size={18} />
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                    {t.namaPelanggan ?? "Pelanggan tanpa nama"}
                                </p>
                                <p className={cn("truncate text-xs", muted)}>
                                    {t.orderItems.map((i) => `${i.namaBarang} × ${i.jumlahBarang}`).join(", ")}
                                </p>
                            </div>

                            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600">
                                Selesai
                            </span>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}