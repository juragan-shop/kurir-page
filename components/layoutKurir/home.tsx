"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Clock,
    ListChecks,
    MapPin,
    Navigation,
    Package,
    StickyNote,
    Truck,
    WifiOff,
} from "lucide-react";

import useTheme from "@/hooks/useTheme";
import { cn } from "@/utils";
import { formatTanggalIndonesia } from "@/utils/formatterDate";

/* ------------------------------ Types ------------------------------ */

type Tugas = {
    id: string;
    namaPelanggan: string;
    namaBarang: string;
    jumlahBarang: number;
    alamat: string;
    catatanPelanggan?: string;
    // mengikuti kurirStatus di model orderItem: PENDING = belum diantar, APPROVED = selesai
    kurirStatus: "PENDING" | "APPROVED";
};

// Data contoh. Ganti dengan data dari API (pesanan yang kurirId-nya = kurir ini).
const dataAwal: Tugas[] = [
    {
        id: "ORD-001",
        namaPelanggan: "Ahmad",
        namaBarang: "Ikan Tuna",
        jumlahBarang: 5,
        alamat: "Jl. Perintis Kemerdekaan No. 12, Tamalanrea, Makassar",
        catatanPelanggan: "Antar sebelum jam 10 pagi, titip ke satpam.",
        kurirStatus: "PENDING",
    },
    {
        id: "ORD-002",
        namaPelanggan: "Rahmat",
        namaBarang: "Ikan Kakap",
        jumlahBarang: 3,
        alamat: "Jl. A.P. Pettarani No. 45, Rappocini, Makassar",
        kurirStatus: "PENDING",
    },
    {
        id: "ORD-003",
        namaPelanggan: "Siti",
        namaBarang: "Ikan Bandeng",
        jumlahBarang: 8,
        alamat: "Jl. Veteran Selatan No. 7, Mamajang, Makassar",
        catatanPelanggan: "Hubungi dulu sebelum sampai.",
        kurirStatus: "PENDING",
    },
    {
        id: "ORD-004",
        namaPelanggan: "Dewi",
        namaBarang: "Cumi-cumi",
        jumlahBarang: 2,
        alamat: "Jl. Sultan Alauddin No. 101, Tamalate, Makassar",
        kurirStatus: "APPROVED",
    },
];

const mapsUrl = (alamat: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(alamat)}`;

export default function KurirHome() {
    const { isDark } = useTheme();
    const { user } = useUser();

    const [tugas, setTugas] = useState<Tugas[]>(dataAwal);
    const [online, setOnline] = useState(true);
    const [now, setNow] = useState<Date | null>(null);
    const [finishingId, setFinishingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // new Date() dibaca di useEffect agar aman saat prerender Next.js
    useEffect(() => {
        setNow(new Date());
    }, []);

    const nama =
        user?.firstName ??
        (user?.unsafeMetadata?.nama as string | undefined) ??
        "Kurir";

    const { pending, selesai, persen } = useMemo(() => {
        const p = tugas.filter((t) => t.kurirStatus === "PENDING");
        const s = tugas.filter((t) => t.kurirStatus === "APPROVED");
        return {
            pending: p,
            selesai: s,
            persen: tugas.length ? Math.round((s.length / tugas.length) * 100) : 0,
        };
    }, [tugas]);

    const berikutnya = pending[0];
    const antrean = pending.slice(1);

    const tandaiSelesai = async (id: string) => {
        if (finishingId) return;

        setFinishingId(id);
        setError(null);

        try {
            // TODO: panggil API untuk memperbarui kurirStatus di backend.
            await new Promise((resolve) => setTimeout(resolve, 500));

            setTugas((current) =>
                current.map((t) => (t.id === id ? { ...t, kurirStatus: "APPROVED" } : t)),
            );
        } catch {
            setError("Gagal menyimpan. Periksa koneksi lalu coba lagi.");
        } finally {
            setFinishingId(null);
        }
    };

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

    /* -------------------------------- UI -------------------------------- */

    return (
        <section className="mx-auto w-full space-y-5">
            {/* Hero */}
   

            {/* Banner error */}
            {error && (
                <div
                    role="alert"
                    className={cn(
                        "animate-in fade-in flex items-center gap-3 rounded-2xl border p-4 text-sm duration-300",
                        isDark
                            ? "border-red-400/30 bg-red-500/10 text-red-200"
                            : "border-red-200 bg-red-50 text-red-700",
                    )}
                >
                    <AlertCircle size={18} className="shrink-0" />
                    {error}
                </div>
            )}

            {/* Statistik */}
            <div className="grid grid-cols-3 gap-3">
                {stats.map(({ label, value, Icon, color }, i) => (
                    <article
                        key={label}
                        style={{ animationDelay: `${i * 70}ms` }}
                        className={cn(
                            card,
                            "animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500",
                            "p-3.5 hover:-translate-y-0.5 hover:shadow-md",
                        )}
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

            {/* Tugas berikutnya */}
            {berikutnya ? (
                <article
                    className={cn(
                        card,
                        "animate-in fade-in slide-in-from-bottom-3 duration-500",
                        "relative overflow-hidden p-5 pl-6",
                    )}
                >
                    <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-600 to-lime-400" />

                    <div className="flex items-center justify-between gap-3">
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
                                "text-xs font-semibold ring-1",
                                "bg-emerald-500/10 ring-emerald-500/25",
                                accentText,
                            )}
                        >
                            <Truck size={13} />
                            Tugas berikutnya
                        </span>
                        <span className={cn("font-mono text-xs", muted)}>{berikutnya.id}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-lime-400 text-lg font-bold text-white">
                            {berikutnya.namaPelanggan.charAt(0)}
                        </span>
                        <div className="min-w-0">
                            <h2 className="truncate text-lg font-semibold">
                                {berikutnya.namaPelanggan}
                            </h2>
                            <p className={cn("flex items-center gap-1.5 text-sm", muted)}>
                                <Package size={14} />
                                {berikutnya.namaBarang} · {berikutnya.jumlahBarang} pcs
                            </p>
                        </div>
                    </div>

                    <div className={cn("mt-4 space-y-3 rounded-xl p-3.5 text-sm", tile)}>
                        <p className="flex items-start gap-2.5">
                            <MapPin size={16} className={cn("mt-0.5 shrink-0", accentText)} />
                            <span>{berikutnya.alamat}</span>
                        </p>

                        {berikutnya.catatanPelanggan && (
                            <p className="flex items-start gap-2.5">
                                <StickyNote size={16} className="mt-0.5 shrink-0 text-amber-500" />
                                <span className={muted}>{berikutnya.catatanPelanggan}</span>
                            </p>
                        )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <a
                            href={mapsUrl(berikutnya.alamat)}
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

                        <button
                            type="button"
                            disabled={finishingId !== null}
                            onClick={() => tandaiSelesai(berikutnya.id)}
                            className={cn(
                                "inline-flex h-12 items-center justify-center gap-2 rounded-xl",
                                "bg-gradient-to-r from-emerald-600 to-emerald-500 text-sm font-semibold text-white",
                                "shadow-md shadow-emerald-500/30 transition-all duration-200",
                                "hover:brightness-110 active:scale-95 disabled:opacity-60",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
                            )}
                        >
                            <CheckCircle2 size={16} />
                            {finishingId === berikutnya.id ? "Menyimpan..." : "Tandai selesai"}
                        </button>
                    </div>
                </article>
            ) : (
                <div className={cn(card, "flex flex-col items-center gap-3 p-10 text-center")}>
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                        <CheckCircle2 size={28} />
                    </span>
                    <div>
                        <p className="font-semibold">Semua tugas selesai</p>
                        <p className={cn("text-sm", muted)}>
                            Tidak ada pengantaran yang menunggu saat ini.
                        </p>
                    </div>
                </div>
            )}

            {/* Antrean berikutnya */}
            {antrean.length > 0 && (
                <div className="space-y-3">
                    <h2 className="flex items-center justify-between px-1 text-sm font-semibold">
                        Antrean berikutnya
                        <span className={cn("text-xs font-normal", muted)}>
                            {antrean.length} tugas
                        </span>
                    </h2>

                    {antrean.map((t, i) => (
                        <article
                            key={t.id}
                            style={{ animationDelay: `${i * 70}ms` }}
                            className={cn(
                                card,
                                "animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500",
                                "flex items-center gap-3 p-4 hover:-translate-y-0.5 hover:shadow-md",
                            )}
                        >
                            <span
                                className={cn(
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                                    "text-sm font-bold",
                                    isDark ? "bg-white/10" : "bg-emerald-50 text-emerald-700",
                                )}
                            >
                                {i + 2}
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{t.namaPelanggan}</p>
                                <p className={cn("truncate text-xs", muted)}>
                                    {t.namaBarang} · {t.jumlahBarang} pcs
                                </p>
                                <p className={cn("mt-0.5 truncate text-xs", muted)}>{t.alamat}</p>
                            </div>

                            <a
                                href={mapsUrl(t.alamat)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Navigasi ke ${t.namaPelanggan}`}
                                className={cn(
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                                    "transition-all duration-200 active:scale-90",
                                    isDark
                                        ? "text-emerald-400 hover:bg-white/10"
                                        : "text-emerald-600 hover:bg-emerald-50",
                                )}
                            >
                                <ChevronRight size={18} />
                            </a>
                        </article>
                    ))}
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
                                <p className="truncate font-medium">{t.namaPelanggan}</p>
                                <p className={cn("truncate text-xs", muted)}>
                                    {t.namaBarang} · {t.jumlahBarang} pcs
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