import { create } from "zustand";
import { TabKeyKurir } from "./tabKeyKurir";



interface TabStore {
  activeTab: TabKeyKurir;
  setActiveTab: (tab: TabKeyKurir) => void;
}

export const useTabStore = create<TabStore>((set) => ({
  activeTab: "home",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));