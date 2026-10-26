import Chat from "@/components/layoutKurir/chat";
import ConfirmOrder from "@/components/layoutKurir/confirmOrder";
import HistoryOrder from "@/components/layoutKurir/historyOrder";
import KurirHome from "@/components/layoutKurir/home"

export const tabStrategies = {
    home: <KurirHome/>,
    profile:<></> ,
    historyOrder: <HistoryOrder/>,
    orderPage: <ConfirmOrder/>,
    chat: <Chat/>,

 
} as const;

export type TabKeyKurir = keyof typeof tabStrategies;