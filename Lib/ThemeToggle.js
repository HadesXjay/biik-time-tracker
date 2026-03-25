"use client";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("biik-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem("biik-theme", newTheme);
  };

  return (
    <button 
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-biik text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 dark:hover:bg-black/10 transition-all"
    >
      {theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
    </button>
  );
}