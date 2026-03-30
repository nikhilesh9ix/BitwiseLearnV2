"use client";

import { useTheme } from "@/component/general/(Color Manager)/ThemeController";
import { Sun, Moon } from 'lucide-react'
import { getColors } from "./useColors";

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "Dark";
  const Colors = getColors();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      role="switch"
      aria-checked={isDark}
      className={`
        relative
        w-14 h-8
        rounded-full
        transition-colors duration-500 ease-in-out cursor-pointer
        ${Colors.background.secondary}
      `}
    >
      {/* Knob */}
      <span
        className={`
          absolute top-1 left-1
          h-6 w-6
          p-1
          rounded-full
          ${isDark ? "bg-neutral-100" : "bg-neutral-900"}
          flex items-center justify-center
          transition-all duration-500 ease-in-out
          ${isDark ? "translate-x-6" : "translate-x-0"}
        `}
      >
        {isDark ? <Moon color="black" /> : <Sun color="white" />}
      </span>
    </button>
  );
}


