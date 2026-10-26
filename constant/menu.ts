import { TabKey } from "@/store/tabKey";
import { Code2, Fish, FishIcon, FrameIcon, LucideIcon, VeganIcon } from "lucide-react";

type menuType = {
    id: string
    label: string
    icon: LucideIcon,
    items: {
        label: string,
        tab: TabKey
    }[]
}
export const menuGroups: menuType[] = [
    {
        id: "Language",
        label: "Ikan",
        icon: FishIcon,
        items: [
            { label: "Ekor Kuning", tab: "fish" },
            { label: "Kembung", tab: "home" },
            { label: "Tongkol", tab: "home" },
        ]
    },
    {
        id: "Framework",
        label: "Sayur",
        icon: VeganIcon,
        items: [
            { label: "Segera Hadir", tab: "home" },

        ]
    }
]