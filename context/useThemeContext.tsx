"use client"

import { ReactNode } from "react"

export interface ThemeContextTypes {
    isDark : boolean
    ThemeToggle: () => void 
}


export interface ThemeProvider {
    children : ReactNode
}
import { createContext, useState } from "react";
export const ThemeContext = createContext<ThemeContextTypes | undefined>(undefined)
export function ThemeContextProvider({ children }: ThemeProvider) {
    const [isDark, setIsDark] = useState(true)
    const ThemeToggle = () => setIsDark(prev => !prev)
    return (
        <ThemeContext.Provider value={{
            isDark,
            ThemeToggle
        }}>
            {children}
        </ThemeContext.Provider>
    )
}