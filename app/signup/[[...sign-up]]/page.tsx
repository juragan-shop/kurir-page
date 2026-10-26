'use client';

import { useEffect, useState, } from 'react';
import {  useAuth, useClerk, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LocateFixed,
  Mail,
  MapPin,
  ShoppingBag,
  Store,
  Truck,
  User,
  Phone,
  Pencil,
} from 'lucide-react';
import type { SyntheticEvent } from 'react';
const APP_NAME = 'Toko Juragan';

const steps = [
  { label: 'Akun', Icon: User },
  { label: 'Alamat', Icon: MapPin },
  { label: 'Jenis akun', Icon: BadgeCheck },
] as const;

const fieldBase =
  'h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-4 text-[15px] text-slate-900 ' +
  'outline-none transition placeholder:text-slate-400 hover:border-slate-300 ' +
  'focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10';
const fieldPlain = `${fieldBase} pl-4`;
const fieldIcon = `${fieldBase} pl-11`;
const iconCls =
  'pointer-events-none absolute left-3.5 text-slate-400 transition-colors peer-focus:text-blue-600';
const labelCls = 'mb-1.5 block text-sm font-medium text-slate-700';

type GpsStatus = 'idle' | 'loading' | 'done';

// Reverse geocoding (koordinat -> alamat) lewat OpenStreetMap Nominatim
async function ambilAlamat(lat: number, lon: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=id&lat=${lat}&lon=${lon}`,
  );

  if (!response.ok) throw new Error('Reverse geocoding gagal');

  const data = (await response.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };

  const a = data.address ?? {};
  const jalan = [a.road, a.house_number].filter(Boolean).join(' ');
  const parts = [
    jalan,
    a.neighbourhood ?? a.suburb ?? a.village,
    a.city_district,
    a.city ?? a.town ?? a.county,
    a.state,
    a.postcode,
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : (data.display_name ?? '');
}

export default function Page() {
  const { signUp, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const url = process.env.NEXT_PUBLIC_BACKEND_URL!
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alamat, setAlamat] = useState('');
  const [nomorTelpon, setNomorTelpon] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [role, setRole] = useState('PELANGGAN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<number | null>(null);

  // new Date() tidak boleh dibaca saat render (prerender Next.js), jadi dibaca di useEffect
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const lastStep = steps.length - 1;



  function validateStep(index: number): string {
    if (index === 0) {
      if (!firstName.trim() || !lastName.trim()) {
        return 'Isi nama depan dan nama belakang.';
      }
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        return 'Masukkan alamat email yang valid.';
      }
      if (password.length < 8) {
        return 'Password minimal 8 karakter.';
      }
    }

    if (index === 1 && !alamat.trim()) {
      return 'Alamat lengkap wajib diisi.';
    }

    return '';
  }

  function goNext() {
    const message = validateStep(step);

    if (message) {
      setError(message);
      return;
    }

    setError('');
    setStep((s) => Math.min(s + 1, lastStep));
  }

  function goBack() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  }


  function ambilLokasi() {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung GPS.');
      return;
    }

    setGpsStatus('loading');
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;


        setLatitude(String(lat));
        setLongitude(String(lon));

        try {
          const hasil = await ambilAlamat(lat, lon);

          if (hasil) {
            setAlamat(hasil);
          } else {
            setError('Alamat tidak ditemukan. Silakan isi alamat secara manual.');
          }
        } catch {
          setError(
            'Lokasi didapat, tetapi alamat gagal diisi otomatis. Silakan isi alamat secara manual.',
          );
        }

        setGpsStatus('done');
      },
      () => {
        setGpsStatus('idle');
        setError('Lokasi gagal diambil. Izinkan akses lokasi di browser.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }


  async function handleSignup(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    // Enter di langkah awal = lanjut ke langkah berikutnya
    if (step < lastStep) {
      goNext();
      return;
    }

    if (loading || fetchStatus === 'fetching') return;

    // Validasi ulang semua langkah sebelum kirim
    for (let i = 0; i < lastStep; i++) {
      const message = validateStep(i);
      if (message) {
        setStep(i);
        setError(message);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const { error: signupError } = await signUp.password({
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        unsafeMetadata: {
          nomorTelpon,
          alamat,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,

        },
      });
   

          

      if (signupError) {
        console.error('Clerk signUp error:', signupError);
        setError(signupError.message);
        return;
      }

      if (signUp.status !== 'complete') {
        const info = signUp as unknown as {
          status?: string;
          missingFields?: string[];
          unverifiedFields?: string[];
        };

        console.error('Sign-up belum complete:', {
          status: info.status,
          missingFields: info.missingFields,
          unverifiedFields: info.unverifiedFields,
        });

        const detail = [
          info.missingFields?.length
            ? `field kurang: ${info.missingFields.join(', ')}`
            : '',
          info.unverifiedFields?.length
            ? `belum diverifikasi: ${info.unverifiedFields.join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join(' | ');

        setError(
          `Pendaftaran belum selesai (status: ${info.status ?? 'tidak diketahui'}${detail ? ` | ${detail}` : ''
          }). Periksa pengaturan di Clerk Dashboard.`,
        );
        return;
      }

      const { error: finalizeError } = await signUp.finalize();

      if (finalizeError) {
        setError(finalizeError.message);
        return;
      }

      router.push('/');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Pendaftaran gagal. Silakan coba lagi.',
      );
    } finally {
      setLoading(false);
    }
  }

  const isLoading = loading || fetchStatus === 'fetching';


useEffect(() => {
  if(isSignedIn){
    router.replace("/")
  }
},[])

  // if (isSignedIn) {
  //   return (
  //     <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-100/70 to-slate-50 p-5">
  //       <section className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-xl shadow-blue-900/5 ring-1 ring-slate-900/5">
  //         <div className="space-y-2">
  //           <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
  //             Kamu sudah masuk
  //           </h1>
  //           <p className="text-slate-500">
  //             Untuk mendaftarkan akun baru, keluar dulu dari akun yang sedang aktif.
  //           </p>
  //         </div>

  //         <div className="flex flex-col gap-3 sm:flex-row">
  //           <button
  //             type="button"
  //             onClick={() => router.push('/')}
  //             className="h-12 flex-1 rounded-xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.98]"
  //           >
  //             Lanjut ke aplikasi
  //           </button>

  //           <button
  //             type="button"
  //             onClick={() => signOut({ redirectUrl: '/signup' })}
  //             className="h-12 flex-1 rounded-xl border border-slate-200 font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
  //           >
  //             Keluar
  //           </button>
  //         </div>
  //       </section>
  //     </main>
  //   );
  // }


  const labelCls = 'mb-1.5 block text-sm font-medium text-slate-700';

  // text-base (16px) mencegah browser iPhone melakukan zoom otomatis saat input diketuk
  const inputBase =
    'peer h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-4 text-base text-slate-900 ' +
    'outline-none transition placeholder:text-slate-400 hover:border-slate-300 ' +
    'focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10';

  const fieldPlain = `${inputBase} pl-4`;
  const fieldIcon = `${inputBase} pl-11`;

  const iconCls =
    'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors peer-focus:text-blue-600';
  const iconTopCls =
    'pointer-events-none absolute left-3.5 top-3.5 text-slate-400 transition-colors peer-focus:text-blue-600';

  const hintCls = 'mt-1.5 text-xs text-slate-500';

  const stepInfo = [
    { title: 'Data diri', desc: 'Isi nama, nomor WhatsApp, email, dan buat password.' },
    { title: 'Alamat pengiriman', desc: 'Supaya pesananmu sampai ke tempat yang tepat.' },
    { title: 'Periksa data', desc: 'Pastikan semuanya benar, lalu selesaikan pendaftaran.' },
  ];


  return (
    <main className="flex min-h-dvh flex-col items-center bg-slate-50 sm:justify-center sm:px-4 sm:py-10">
      <section className="flex w-full max-w-md flex-1 flex-col bg-white px-5 pb-0 pt-6 sm:flex-none sm:rounded-3xl sm:p-8 sm:shadow-xl sm:shadow-slate-900/5 sm:ring-1 sm:ring-slate-900/5">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base font-bold text-white">
            {APP_NAME.charAt(0)}
          </span>
          <span className="font-semibold tracking-tight text-slate-900">{APP_NAME}</span>
        </div>

        {/* Progres */}
        <div className="mb-6" role="group" aria-label="Langkah pendaftaran">
          <div className="mb-3 flex gap-1.5" aria-hidden="true">
            {steps.map(({ label }, i) => (
              <span key={label} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <span
                  className="block h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: i <= step ? '100%' : '0%' }}
                />
              </span>
            ))}
          </div>

          <p className="text-sm font-medium text-blue-600" aria-live="polite">
            Langkah {step + 1} dari {steps.length}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {stepInfo[step].title}
          </h1>
          <p className="mt-1.5 text-base leading-relaxed text-slate-500">{stepInfo[step].desc}</p>
        </div>

        {error && (
          <p
            role="alert"
            className="animate-in fade-in slide-in-from-top-1 mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm leading-relaxed text-rose-700 ring-1 ring-rose-200 duration-300"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <form onSubmit={handleSignup} noValidate className="flex flex-1 flex-col">
          {/* Isi langkah (key = animasi tiap pindah langkah) */}
          <div
            key={step}
            className="animate-in fade-in slide-in-from-right-4 space-y-5 pb-6 duration-300 motion-reduce:animate-none"
          >
            {/* Langkah 1: Data diri */}
            {step === 0 && (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
                  <label className="block">
                    <span className={labelCls}>Nama depan</span>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      className={fieldPlain}
                      placeholder="Budi"
                    />
                  </label>

                  <label className="block">
                    <span className={labelCls}>Nama belakang</span>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                      className={fieldPlain}
                      placeholder="Santoso"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className={labelCls}>Nomor WhatsApp</span>
                  <div className="relative">
                    <input
                      type="tel"
                      name="nomorTelpon"
                      value={nomorTelpon}
                      onChange={(e) => setNomorTelpon(e.target.value)}
                      placeholder="081234567890"
                      autoComplete="tel"
                      inputMode="tel"
                      className={fieldIcon}
                    />
                    <Phone size={18} className={iconCls} />
                  </div>
                  <p className={hintCls}>Gunakan nomor aktif yang terhubung ke WhatsApp.</p>
                </label>

                <label className="block">
                  <span className={labelCls}>Email</span>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      className={fieldIcon}
                      placeholder="nama@email.com"
                    />
                    <Mail size={18} className={iconCls} />
                  </div>
                </label>

                <label className="block">
                  <span className={labelCls}>Password</span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className={`${fieldIcon} pr-12`}
                      placeholder="Buat password"
                    />
                    <Lock size={18} className={iconCls} />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p
                    className={`mt-1.5 flex items-center gap-1.5 text-xs transition-colors ${password.length >= 8 ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                  >
                    <Check size={14} strokeWidth={3} className={password.length >= 8 ? '' : 'opacity-30'} />
                    Minimal 8 karakter
                  </p>
                </label>
              </>
            )}

            {/* Langkah 2: Alamat */}
            {step === 1 && (
              <>
                <div
                  className={
                    'flex flex-col gap-3 rounded-2xl p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ' +
                    (gpsStatus === 'done'
                      ? 'bg-emerald-50 ring-1 ring-emerald-200'
                      : 'bg-blue-50 ring-1 ring-blue-100')
                  }
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ' +
                        (gpsStatus === 'done' ? 'bg-emerald-500' : 'bg-blue-600')
                      }
                    >
                      {gpsStatus === 'done' ? <CheckCircle2 size={18} /> : <LocateFixed size={18} />}
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {gpsStatus === 'done' ? 'Lokasi terdeteksi' : 'Isi alamat otomatis'}
                      </p>
                      <p className="text-xs leading-relaxed text-slate-500">
                        {gpsStatus === 'loading'
                          ? 'Mencari lokasi kamu...'
                          : gpsStatus === 'done'
                            ? 'Periksa alamat di bawah, boleh kamu ubah.'
                            : 'Izinkan akses lokasi di browser.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={ambilLokasi}
                    disabled={gpsStatus === 'loading'}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-blue-700 shadow-sm ring-1 ring-blue-200 transition hover:bg-blue-600 hover:text-white active:scale-[0.98] disabled:opacity-60 sm:w-auto"
                  >
                    {gpsStatus === 'loading' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <LocateFixed size={16} />
                    )}
                    {gpsStatus === 'done' ? 'Ambil ulang' : 'Gunakan lokasi saya'}
                  </button>
                </div>

                <label className="block">
                  <span className={labelCls}>Alamat lengkap</span>
                  <div className="relative">
                    <textarea
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      className={`${fieldIcon} h-auto resize-none py-3 leading-relaxed`}
                      placeholder="Nama jalan, nomor rumah, kelurahan, kota"
                      rows={4}
                    />
                    <MapPin size={18} className={iconTopCls} />
                  </div>
                  <p className={hintCls}>Tulis selengkap mungkin agar kurir mudah menemukan.</p>
                </label>
              </>
            )}

            {/* Langkah 3: Periksa data */}
            {step === 2 && (
              <>
                <dl className="divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4 ring-1 ring-slate-100">
                  {[
                    { label: 'Nama', value: `${firstName} ${lastName}`.trim(), goTo: 0 },
                    { label: 'WhatsApp', value: nomorTelpon, goTo: 0 },
                    { label: 'Email', value: email, goTo: 0 },
                    { label: 'Alamat', value: alamat, goTo: 1 },
                  ].map(({ label, value, goTo }) => (
                    <div key={label} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <dt className="text-xs text-slate-500">{label}</dt>
                        <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">
                          {value || '-'}
                        </dd>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(goTo)}
                        aria-label={`Ubah ${label}`}
                        className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                      >
                        <Pencil size={13} />
                        Ubah
                      </button>
                    </div>
                  ))}
                </dl>

                {/* Widget CAPTCHA Clerk (bot sign-up protection) */}
                <div id="clerk-captcha" />
              </>
            )}
          </div>

          {/* Tombol navigasi: menempel di bawah layar pada HP agar mudah dijangkau ibu jari */}
          <div className="sticky bottom-0 z-10 -mx-5 mt-auto border-t border-slate-100 bg-white/90 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isLoading}
                  aria-label="Kembali"
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] disabled:opacity-60 sm:w-auto sm:px-5"
                >
                  <ArrowLeft size={18} />
                  <span className="hidden sm:inline">Kembali</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  <>
                    {step < lastStep ? 'Lanjut' : 'Daftar sekarang'}
                    <ArrowRight
                      size={18}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="py-5 text-center text-sm text-slate-500 sm:pb-0 sm:pt-6">
            Sudah punya akun?{' '}
            <a
              href="/signin"
              className="font-semibold text-blue-600 underline-offset-4 hover:underline"
            >
              Masuk
            </a>
          </p>
        </form>
      </section>

      <p className="hidden py-6 text-sm text-slate-400 sm:block">
        © {year ?? ''} {APP_NAME}
      </p>
    </main>
  );
}