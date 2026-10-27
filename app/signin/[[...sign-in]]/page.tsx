
"use client";

import { useState, type FormEvent } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function Page() {
    const { signIn, errors, fetchStatus } = useSignIn();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isLoading = loading || fetchStatus === "fetching";

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setError("");

        if (isLoading) return;

        if (!email.trim() || !password) {
            setError("Email dan password wajib diisi.");
            return;
        }

        setLoading(true);

        try {
            const result = await signIn.password({
                emailAddress: email.trim(),
                password,
            });

            if (result.error) {
                setError(
                    result.error.message ||
                        "Gagal masuk. Periksa email dan password.",
                );
                return;
            }

            if (signIn.status === "complete") {
                await signIn.finalize({
                    navigate: async ({ decorateUrl }) => {
                        const url = decorateUrl("/");

                        if (url.startsWith("http")) {
                            window.location.href = url;
                        } else {
                            router.replace(url);
                        }
                    },
                });

                return;
            }

            if (signIn.status === "needs_second_factor") {
                setError(
                    "Akun membutuhkan verifikasi tambahan (MFA).",
                );
                return;
            }

            if (signIn.status === "needs_client_trust") {
                setError(
                    "Perangkat ini membutuhkan verifikasi keamanan tambahan.",
                );
                return;
            }

            setError(
                `Login belum selesai. Status: ${signIn.status}. Diperlukan langkah autentikasi tambahan.`,
            );
        } catch (err: unknown) {
            console.error("Login error:", err);

            setError(
                "Terjadi kesalahan saat login. Silakan coba lagi.",
            );
        } finally {
            setLoading(false);
        }
    };

    const emailError = errors?.fields?.identifier?.message;
    const passwordError = errors?.fields?.password?.message;

    return (
 
<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-950 via-blue-900 to-cyan-800 px-4 py-10">
    {/* Background decoration */}
    <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-blue-400/30 blur-3xl" />
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/10 blur-3xl" />

    <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl shadow-slate-950/30 backdrop-blur-xl md:grid-cols-2">
        {/* Left panel */}
    

<section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-950 p-10 text-white md:flex lg:p-12">
    {/* Dekorasi background */}
    <div className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full border border-white/10" />
    <div className="pointer-events-none absolute -right-10 top-32 h-44 w-44 rounded-full border border-white/10" />
    <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />

    {/* Branding dan logo */}
    <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/30 bg-white/95 p-3 shadow-xl shadow-blue-950/20">
            <Image
                src="/images/logo-juragan-ikan.png"
                alt="Logo Toko Juragan Ikan"
                width={160}
                height={160}
                priority
                className="h-full w-full object-contain"
            />
        </div>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-cyan-100">
            Selamat datang kembali
        </p>

        <h2 className="mt-4 text-4xl font-extrabold leading-tight lg:text-5xl">
            Toko
            <br />
            Juragan Ikan
        </h2>

        <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
            Kelola pesanan ikan, pantau pengiriman, dan
            lanjutkan aktivitas toko melalui satu platform.
        </p>

        {/* Aksen dekoratif */}
        <div className="mt-8 flex items-center gap-2">
            <span className="h-1.5 w-10 rounded-full bg-cyan-300" />
            <span className="h-1.5 w-4 rounded-full bg-white/50" />
            <span className="h-1.5 w-4 rounded-full bg-white/30" />
        </div>
    </div>

    {/* Informasi keamanan */}
    <div className="relative mt-12 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/20 text-cyan-100">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                    aria-hidden="true"
                >
                    <path
                        d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="m9 12 2 2 4-4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            <div>
                <p className="text-sm font-bold">
                    Akun kamu, akses terjaga
                </p>
                <p className="mt-1 text-xs leading-5 text-blue-100">
                    Masuk untuk mengakses fitur sesuai akun dan hak aksesmu.
                </p>
            </div>
        </div>
    </div>

 <p className="relative mt-8 text-xs text-blue-100/70">
  © 2026 Toko Juragan Ikan
</p>
</section>

        {/* Right panel: login form */}
        <section className="bg-white/95 p-6 backdrop-blur-xl sm:p-10 lg:p-12">
            <div className="mb-8 md:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 text-lg font-extrabold text-white shadow-lg shadow-blue-500/25">
                    F
                </div>
            </div>

            <div className="mb-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
                    SIGN IN
                </span>

                <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                    Selamat datang kembali
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                    Masukkan detail akun kamu untuk melanjutkan.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                        Alamat email
                    </label>

                    <div className="group relative">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
                            aria-hidden="true"
                        >
                            <rect x="3" y="5" width="18" height="14" rx="3" />
                            <path d="m4 7 8 6 8-6" />
                        </svg>

                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="nama@email.com"
                            required
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-sky-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />
                    </div>

                    {emailError && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                            {emailError}
                        </p>
                    )}
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <label
                            htmlFor="password"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Password
                        </label>

                        <Link
                            href="/forgot-password"
                            className="text-xs font-semibold text-blue-600 transition hover:text-cyan-700 hover:underline"
                        >
                            Lupa password?
                        </Link>
                    </div>

                    <div className="group relative">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
                            aria-hidden="true"
                        >
                            <rect x="4" y="10" width="16" height="11" rx="3" />
                            <path
                                d="M8 10V7a4 4 0 0 1 8 0v3"
                                strokeLinecap="round"
                            />
                        </svg>

                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Masukkan password"
                            required
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-24 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-sky-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword((previous) => !previous)}
                            className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500 transition hover:text-blue-700"
                        >
                            {showPassword ? "Sembunyikan" : "Lihat"}
                        </button>
                    </div>

                    {passwordError && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                            {passwordError}
                        </p>
                    )}
                </div>

                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="mt-0.5 h-4 w-4 shrink-0"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 8v5m0 3h.01" />
                        </svg>
                        <p>{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    <span className="relative">
                        {isLoading ? "Sedang masuk..." : "Masuk ke akun"}
                    </span>

                    {!isLoading && (
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="relative h-4 w-4 transition-transform group-hover:translate-x-1"
                            aria-hidden="true"
                        >
                            <path
                                d="M5 12h14m-6-6 6 6-6 6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </button>
            </form>

            <div className="my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">
                    PENGGUNA BARU?
                </span>
                <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
                href="/signup"
                className="flex h-12 w-full items-center justify-center rounded-xl border border-sky-200 bg-sky-50/70 px-4 text-sm font-semibold text-blue-700 transition duration-200 hover:border-blue-300 hover:bg-sky-100"
            >
                Buat akun baru
            </Link>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
                Dengan masuk, kamu menggunakan layanan sesuai
                ketentuan dan kebijakan privasi yang berlaku.
            </p>
        </section>
    </div>
</main>

    );
}
