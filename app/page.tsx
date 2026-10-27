"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import {
  Sun,
  Moon,
  Menu,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Home,
  PackageCheck,
  MessageCircle,
  MapPin,
} from "lucide-react";

import { useEffect, useState } from "react";

import { formatTanggalIndonesia } from "@/utils/formatterDate";
import useTheme from "@/hooks/useTheme";
import { cn } from "@/utils";
import { useAuth, useUser } from "@clerk/nextjs";
import { useTabStore } from "@/store/useTabStore";
import { TabKeyKurir, tabStrategies } from "@/store/tabKeyKurir";
import { useRouter } from "next/navigation";
import { DataUser } from "@/types";
import { navItems } from "@/data";


export default function BottomNav() {
  const activeTab = useTabStore((state) => state.activeTab);
  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const { user } = useUser();
  const { ThemeToggle, isDark } = useTheme();
  const router = useRouter()
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [dataUser, setDataUser] = useState<DataUser | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { isLoaded, isSignedIn } = useUser();


  
    useEffect(() => {
    setNow(new Date());
  }, []);


  useEffect(() => {

    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      router.replace('/signin');
      return;
    }
    const role = user.publicMetadata?.role;
    if(!role) return
    if (role !== 'kurir') {
      router.replace('https://instagram.com');
    }
  }, [isLoaded, isSignedIn, user, router]);




  const renderContent = (tab: TabKeyKurir) => tabStrategies[tab];

  const firstName = user?.firstName ?? user?.fullName?.split(" ")[0];

  return (
   
    <div
      className={cn(
        "relative isolate flex min-h-dvh flex-col",
        isDark ? "bg-zinc-950 text-zinc-50" : "bg-emerald-50/60 text-zinc-900"
      )}
    >
      {/* Header */}
      <header
        className={cn(
          "relative overflow-hidden",
          "rounded-b-[2rem] px-5 pb-7 pt-5",
          "text-white shadow-lg shadow-emerald-900/20",
          isDark
            ? "bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-700"
            : "bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500"
        )}
      >
        {/* Lingkaran dekoratif */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-white/5"
        />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
              className={cn(
                "flex h-10 w-10 items-center justify-center",
                "rounded-xl bg-white/15 backdrop-blur",
                "transition active:scale-95 hover:bg-white/25",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              )}
            >
              <Menu size={20} />
            </button>

            <p className="text-xs capitalize text-emerald-50/90">
              {now ? formatTanggalIndonesia(now) : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={ThemeToggle}
            aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
            className={cn(
              "flex h-10 w-10 items-center justify-center",
              "rounded-xl bg-white/15 backdrop-blur",
              "transition active:scale-95 hover:bg-white/25",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            )}
          >
            <span
              key={isDark ? "dark" : "light"}
              className="animate-in spin-in-90 zoom-in-75 duration-300"
            >
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </span>
          </button>
        </div>

        {/* Profil kurir */}
        <div className="relative mt-5 flex items-center gap-3">
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.imageUrl}
              alt="Foto kurir"
              className={cn(
                "h-14 w-14 rounded-full border-2 border-white/70 object-cover"
              )}
            />
          ) : (
            <div className="h-14 w-14 animate-pulse rounded-full bg-white/20" />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm text-emerald-50/90">Halo, semangat kerja!</p>

            {firstName ? (
              <h1 className="truncate text-lg font-bold leading-tight">
                {firstName}
              </h1>
            ) : (
              <div className="mt-1 h-5 w-32 animate-pulse rounded bg-white/20" />
            )}

            {dataUser?.alamat && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-emerald-50/80">
                <MapPin size={12} className="shrink-0" />
                <span className="truncate">{dataUser.alamat}</span>
              </p>
            )}
          </div>
        </div>

        {/* Status online / offline */}
    
      </header>

      {/* FIX 3: tidak perlu pb-28 lagi, nav sekarang ikut alur halaman (sticky) */}
      <main className="min-w-0 flex-1 px-4 pb-4 pt-5">{renderContent(activeTab)}</main>

      {/* Menu samping */}
      {/* <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className={cn(
            "h-dvh w-72 p-0",
            "overflow-y-auto scrollbar-none",
            "border-none text-white",
            "bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-700"
          )}
        >
          <div className="p-5">
            <SheetTitle
              className={cn(
                "mb-5 border-b border-white/30 pb-4",
                "text-center text-lg font-bold text-white"
              )}
            >
              Menu Utama
            </SheetTitle>

            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3",
                "rounded-xl px-3 py-2.5",
                "transition hover:bg-white/10",
                activeTab === "home" && "bg-white/15 font-semibold"
              )}
              onClick={() => {
                setActiveTab("home");
                setOpen(false);
                setOpenMenu(null);
              }}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>

            <div className="mt-2 space-y-1">
              {menuGroups.map((group) => {
                const Icon = group.icon;
                const isOpen = openMenu === group.id;

                return (
                  <div key={group.id}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenMenu(isOpen ? null : group.id)}
                      className={cn(
                        "flex w-full items-center justify-between",
                        "rounded-xl px-3 py-2.5 text-left",
                        "transition hover:bg-white/10",
                        isOpen && "bg-white/10"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{group.label}</span>
                      </span>

                      {isOpen ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </button>

                    {isOpen && (
                      <div className="ml-5 mt-1 space-y-1 border-l border-white/25 pl-3">
                        {group.items.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            className={cn(
                              "block w-full rounded-lg",
                              "px-3 py-2 text-left text-sm",
                              "transition hover:bg-white/10"
                            )}
                            onClick={() => {
                              setActiveTab(item.tab);
                              setOpen(false);
                              setOpenMenu(null);
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet> */}

      {/* FIX 4: Navigasi bawah.
                Sebelumnya `fixed` + z-50 sehingga melayang di atas konten/komponen lain.
                Sekarang `sticky bottom-0` di dalam alur flex: selalu di dasar layar,
                tapi saat scroll sampai bawah, konten berhenti DI ATAS nav (tidak tertutup).
                Wrapper pointer-events-none supaya area kosong di kiri-kanan pil tetap bisa disentuh. */}
      <div className="pointer-events-none sticky bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <nav
          aria-label="Navigasi utama"
          className={cn(
            "pointer-events-auto mx-auto flex w-full max-w-md items-center justify-around gap-1",
            "rounded-3xl p-2",
            "border shadow-xl backdrop-blur-xl",
            isDark
              ? "border-emerald-900/60 bg-zinc-900/90 shadow-black/50"
              : "border-emerald-100 bg-white/90 shadow-emerald-900/10"
          )}
        >
          {navItems.map(({ key, label, Icon }) => {
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2",
                  "rounded-2xl px-3 py-2.5",
                  "text-sm font-semibold",
                  "transition-all duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : isDark
                      ? "text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
                      : "text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                {isActive && <span>{label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}