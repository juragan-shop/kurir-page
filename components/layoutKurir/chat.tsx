"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, MessageCircle, RefreshCw, Search, Send } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import useTheme from "@/hooks/useTheme";
import { cn } from "@/utils";

// ---------- Tipe data (sesuaikan dengan response backend) ----------
interface ChatRoom {
    id: string; // = id order
    kodePesanan: string;
    namaPelanggan: string;
    lastMessage: string;
    lastMessageAt: string; // ISO
    unread: number;
}

interface ChatMessage {
    id: string;
    sender: "kurir" | "pelanggan";
    text: string;
    createdAt: string; // ISO
    status?: "sending" | "failed"; // hanya untuk pesan lokal yang belum tersimpan
}

const quickReplies = [
    "Saya dalam perjalanan",
    "Saya sudah di lokasi",
    "Mohon dibukakan pintu",
];

// ---------- Helper ----------
const jam = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

const waktuSingkat = (iso: string) => {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString()
        ? jam(iso)
        : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
};

function useChatApi() {
    const { getToken } = useAuth();
    const url = process.env.NEXT_PUBLIC_BACKEND_URL;

    return async function api<T>(path: string, init?: RequestInit): Promise<T> {
        if (!url) throw new Error("NEXT_PUBLIC_BACKEND_URL belum diatur");
        const token = await getToken();
        const res = await fetch(`${url}${path}`, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...init?.headers,
            },
        });
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as T;
    };
}

// =====================================================================
// Halaman utama: daftar room <-> jendela chat
// initialRoomId: opsional, untuk langsung membuka chat dari halaman Pesanan
// =====================================================================
export default function Chat({ initialRoomId = null }: { initialRoomId?: string | null }) {
    const api = useChatApi();

    const [activeId, setActiveId] = useState<string | null>(initialRoomId);
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadRooms = async () => {
        try {
            // TODO: sesuaikan endpoint
            const data = await api<ChatRoom[]>("/chat/rooms");
            setRooms(
                [...data].sort(
                    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                )
            );
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    // Muat daftar room, lalu segarkan tiap 15 detik selama daftar tampil
    useEffect(() => {
        if (activeId) return;
        loadRooms();
        const timer = setInterval(loadRooms, 15000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId]);

    const openRoom = (id: string) => {
        setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, unread: 0 } : r)));
        setActiveId(id);
        // TODO: sesuaikan endpoint "tandai sudah dibaca"
        api(`/chat/rooms/${id}/read`, { method: "POST" }).catch(() => { });
    };

    if (activeId) {
        return (
            <ChatWindow
                roomId={activeId}
                room={rooms.find((r) => r.id === activeId)}
                onBack={() => setActiveId(null)}
            />
        );
    }

    return (
        <RoomList
            rooms={rooms}
            loading={loading}
            error={error}
            onRetry={() => {
                setLoading(true);
                loadRooms();
            }}
            onOpen={openRoom}
        />
    );
}

// =====================================================================
// Daftar room (satu room = satu pesanan)
// =====================================================================
function RoomList({
    rooms,
    loading,
    error,
    onRetry,
    onOpen,
}: {
    rooms: ChatRoom[];
    loading: boolean;
    error: boolean;
    onRetry: () => void;
    onOpen: (id: string) => void;
}) {
    const { isDark } = useTheme();
    const [query, setQuery] = useState("");
    const [onlyUnread, setOnlyUnread] = useState(false);

    const card = isDark
        ? "bg-zinc-900 ring-1 ring-zinc-800"
        : "bg-white ring-1 ring-emerald-100 shadow-sm shadow-emerald-900/5";
    const muted = isDark ? "text-zinc-400" : "text-zinc-500";

    const totalUnread = rooms.reduce((sum, r) => sum + r.unread, 0);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rooms.filter(
            (r) =>
                (!onlyUnread || r.unread > 0) &&
                (!q || r.kodePesanan.toLowerCase().includes(q) || r.namaPelanggan.toLowerCase().includes(q))
        );
    }, [rooms, query, onlyUnread]);

    return (
        <section aria-labelledby="judul-chat" className="space-y-4">
            <div>
                <h2 id="judul-chat" className="text-xl font-bold tracking-tight">
                    Chat pesanan
                </h2>
                <p className={cn("text-sm", muted)}>Setiap pesanan punya ruang chat sendiri.</p>
            </div>

            {/* Cari + filter */}
            <div className="space-y-2">
                <div className="relative">
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari kode pesanan atau nama"
                        className={cn(
                            "peer h-12 w-full rounded-xl pl-11 pr-4 text-base outline-none transition",
                            "focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 border",
                            isDark
                                ? "border-zinc-800 bg-zinc-900 placeholder:text-zinc-500"
                                : "border-emerald-100 bg-white placeholder:text-zinc-400"
                        )}
                    />
                    <Search
                        size={18}
                        className={cn(
                            "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors peer-focus:text-emerald-600",
                            muted
                        )}
                    />
                </div>

                <button
                    type="button"
                    aria-pressed={onlyUnread}
                    onClick={() => setOnlyUnread((v) => !v)}
                    className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition active:scale-95",
                        onlyUnread
                            ? "bg-emerald-600 text-white"
                            : isDark
                                ? "bg-zinc-900 text-zinc-300 ring-1 ring-zinc-800"
                                : "bg-white text-zinc-600 ring-1 ring-emerald-100"
                    )}
                >
                    Belum dibaca
                    {totalUnread > 0 && (
                        <span className="rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
                            {totalUnread}
                        </span>
                    )}
                </button>
            </div>

            {loading && (
                <ul className="space-y-2" aria-busy="true" aria-label="Memuat chat">
                    {[0, 1, 2, 3].map((i) => (
                        <li key={i} className={cn("h-[72px] animate-pulse rounded-2xl", card)} />
                    ))}
                </ul>
            )}

            {!loading && error && rooms.length === 0 && (
                <div role="alert" className={cn("flex flex-col items-center gap-3 rounded-2xl p-6 text-center", card)}>
                    <p className="text-sm">Chat belum bisa dimuat. Periksa koneksi, lalu coba lagi.</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition active:scale-95"
                    >
                        <RefreshCw size={16} />
                        Coba lagi
                    </button>
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className={cn("flex flex-col items-center gap-2 rounded-2xl px-6 py-10 text-center", card)}>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                        <MessageCircle size={24} />
                    </span>
                    <p className="font-semibold">
                        {query || onlyUnread ? "Chat tidak ditemukan" : "Belum ada chat"}
                    </p>
                    <p className={cn("text-sm", muted)}>
                        {query || onlyUnread
                            ? "Coba ubah kata pencarian atau filter."
                            : "Ruang chat muncul saat kamu mendapat pesanan."}
                    </p>
                </div>
            )}

            {filtered.length > 0 && (
                <ul className="space-y-2">
                    {filtered.map((room) => (
                        <li key={room.id}>
                            <button
                                type="button"
                                onClick={() => onOpen(room.id)}
                                className={cn(
                                    "flex min-h-[72px] w-full items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.99]",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                                    card
                                )}
                            >
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
                                    {room.namaPelanggan.charAt(0).toUpperCase()}
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className="flex items-baseline justify-between gap-2">
                                        <span className="truncate font-semibold">{room.namaPelanggan}</span>
                                        <span className={cn("shrink-0 text-xs", muted)}>
                                            {waktuSingkat(room.lastMessageAt)}
                                        </span>
                                    </span>
                                    <span className={cn("block truncate text-xs", muted)}>
                                        Pesanan #{room.kodePesanan}
                                    </span>
                                    <span className="mt-0.5 flex items-center justify-between gap-2">
                                        <span
                                            className={cn(
                                                "truncate text-sm",
                                                room.unread > 0 ? "font-medium" : muted
                                            )}
                                        >
                                            {room.lastMessage || "Belum ada pesan"}
                                        </span>
                                        {room.unread > 0 && (
                                            <span
                                                aria-label={`${room.unread} pesan belum dibaca`}
                                                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white"
                                            >
                                                {room.unread}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

// =====================================================================
// Jendela chat satu room
// =====================================================================
function ChatWindow({
    roomId,
    room,
    onBack,
}: {
    roomId: string;
    room?: ChatRoom;
    onBack: () => void;
}) {
    const api = useChatApi();
    const { isDark } = useTheme();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Ambil pesan, lalu cek pesan baru tiap 4 detik
    const socketRef = useRef<Socket | null>(null);
    const { getToken } = useAuth();

    useEffect(() => {
        let socket: Socket | undefined;
        let cancelled = false;

        async function connect() {
            const token = await getToken();

            if (!token || cancelled) return;

            socket = io(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`,
                {
                    auth: { token },
                    transports: ["websocket"],
                }
            );

            socketRef.current = socket;

            socket.on("connect", () => {
                socket?.emit("joinOrderRoom", { orderId: roomId });
            });

            socket.on("message", (message) => {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === message.id)) {
                        return prev;
                    }

                    return [
                        ...prev,
                        {
                            id: message.id,
                            sender:
                                message.senderRole === "KURIR"
                                    ? "kurir"
                                    : "pelanggan",
                            text: message.content,
                            createdAt: message.createdAt,
                        },
                    ];
                });
            });
        }

        connect();

        return () => {
            cancelled = true;
            socket?.disconnect();
            socketRef.current = null;
        };
    }, [roomId, getToken]);
    // Selalu gulir ke pesan terbaru (hanya di dalam kotak chat, bukan seluruh halaman)
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages.length]);

    const send = (text: string) => {
        const content = text.trim();
        const socket = socketRef.current;

        if (!content || !socket?.connected) return;

        socket.emit(
            "chatUserToKurir",
            {
                orderId: roomId,
                content,
            },
            (response: { id?: string; error?: string }) => {
                if (response?.error) {
                    console.error("Pesan gagal dikirim:", response.error);
                }
            }
        );
    };
    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        const text = draft;
        setDraft("");
        send(text);
    };

    const muted = isDark ? "text-zinc-400" : "text-zinc-500";
    const border = isDark ? "border-zinc-800" : "border-emerald-100";

    return (
        <section
            aria-label={`Chat pesanan ${room?.kodePesanan ?? ""}`}
            className={cn(
                "flex h-[70dvh] min-h-[440px] flex-col overflow-hidden rounded-2xl",
                isDark
                    ? "bg-zinc-900 ring-1 ring-zinc-800"
                    : "bg-white ring-1 ring-emerald-100 shadow-sm shadow-emerald-900/5"
            )}
        >
            {/* Header room */}
            <div className={cn("flex items-center gap-3 border-b p-3", border)}>
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Kembali ke daftar chat"
                    className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition active:scale-95",
                        isDark ? "hover:bg-zinc-800" : "hover:bg-emerald-50"
                    )}
                >
                    <ArrowLeft size={20} />
                </button>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                    {(room?.namaPelanggan ?? "?").charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0">
                    <p className="truncate font-semibold leading-tight">
                        {room?.namaPelanggan ?? "Chat pesanan"}
                    </p>
                    <p className={cn("truncate text-xs", muted)}>
                        {room ? `Pesanan #${room.kodePesanan}` : `Pesanan ${roomId}`}
                    </p>
                </div>
            </div>

            {/* Pesan */}
            <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                className="flex-1 space-y-2 overflow-y-auto px-3 py-4"
            >
                {loading && <p className={cn("text-center text-sm", muted)}>Memuat pesan...</p>}

                {!loading && messages.length === 0 && (
                    <p className={cn("px-6 py-8 text-center text-sm", muted)}>
                        Belum ada pesan. Sapa pelanggan untuk mengabari pengantaran.
                    </p>
                )}

                {messages.map((m) => {
                    const mine = m.sender === "kurir";
                    return (
                        <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                            <p
                                className={cn(
                                    "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-snug",
                                    mine
                                        ? "rounded-br-md bg-emerald-600 text-white"
                                        : cn(
                                            "rounded-bl-md",
                                            isDark ? "bg-zinc-800 text-zinc-50" : "bg-emerald-50 text-zinc-900"
                                        ),
                                    m.status === "sending" && "opacity-60"
                                )}
                            >
                                {m.text}
                            </p>

                            {m.status === "failed" ? (
                                <button
                                    type="button"
                                    onClick={() => send(m.text)}
                                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-rose-500 transition-colors hover:text-rose-600 hover:underline"
                                >
                                    <span>Gagal terkirim</span>
                                    <span aria-hidden="true">·</span>
                                    <span>Kirim ulang</span>
                                </button>
                            ) : (
                                <span
                                    className={cn(
                                        "mt-1 block text-[11px]",
                                        muted,
                                        m.status === "sending" && "animate-pulse"
                                    )}
                                    aria-live="polite"
                                >
                                    {m.status === "sending" ? "Mengirim..." : jam(m.createdAt)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Balasan cepat */}
            <div className="flex gap-2 overflow-x-auto px-3 pb-2 scrollbar-none">
                {quickReplies.map((text) => (
                    <button
                        key={text}
                        type="button"
                        onClick={() => send(text)}
                        className={cn(
                            "h-9 shrink-0 rounded-full px-3.5 text-sm transition active:scale-95",
                            isDark
                                ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        )}
                    >
                        {text}
                    </button>
                ))}
            </div>

            {/* Input */}
            <form onSubmit={onSubmit} className={cn("flex items-center gap-2 border-t p-3", border)}>
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Tulis pesan"
                    aria-label="Tulis pesan"
                    autoComplete="off"
                    className={cn(
                        "h-12 min-w-0 flex-1 rounded-xl border px-4 text-base outline-none transition",
                        "focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10",
                        isDark
                            ? "border-zinc-800 bg-zinc-950 placeholder:text-zinc-500"
                            : "border-emerald-100 bg-emerald-50/50 placeholder:text-zinc-400"
                    )}
                />
                <button
                    type="submit"
                    disabled={!draft.trim()}
                    aria-label="Kirim pesan"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25 transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
                >
                    <Send size={19} />
                </button>
            </form>
        </section>
    );
}