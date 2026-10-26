import { Home, MessageCircle, PackageCheck } from "lucide-react";

export const navItems = [
  { key: "home", label: "Beranda", Icon: Home },
  { key: "orderPage", label: "Pesanan", Icon: PackageCheck },
  { key: "chat", label: "Chat", Icon: MessageCircle },
  { key: "historyOrder", label: "OrderHistory", Icon: MessageCircle },
] as const;
