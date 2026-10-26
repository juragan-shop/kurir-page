
import { TabKeyBendahara } from "@/store/tabKeyBendahara";
import { Code2, Fish, FishIcon, FrameIcon, List, LucideIcon, ShoppingBag, VeganIcon } from "lucide-react";

type menuType = {
    id: string
    label: string
    icon: LucideIcon,
    items: {
        label: string,
        tab: TabKeyBendahara
    }[]
}
export const menuGroups: menuType[] = [
    {
        id: "Order",
        label: "Order",
        icon: List,
        items: [
            { label: "Daftar Orderan", tab: "home" },

        ]
    },
    {
        id: "Eceran",
        label: "Eceran",
        icon: ShoppingBag,
        items: [
            { label: "Tambah Penjual", tab: "home" },

        ]
    }
]