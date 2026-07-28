import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

// 🔥 Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {

  const getInitialTheme = () => {
    if (typeof window === "undefined") return "wine";

    const saved = localStorage.getItem("theme");
    if (saved) return saved;

    return "wine";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // 🔄 Toggle (only red family themes)
  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === "wine") return "light";
      if (prev === "light") return "dark";
      return "wine";
    });
  };

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark", "wine");
    root.classList.add(theme);

    localStorage.setItem("theme", theme);

    // 🍷 WINE (Luxury Deep Red)
    if (theme === "wine") {
      root.style.setProperty("--bg", "#1a0005");
      root.style.setProperty("--card", "rgba(43,10,18,0.8)");
      root.style.setProperty("--text", "#ffe5ec");
      root.style.setProperty("--primary", "#7a1f2f");
      root.style.setProperty("--accent", "#ffccd5");
      root.style.setProperty("--border", "#5a1422");
      root.style.setProperty("--glass", "blur(12px)");
    }

    // 🌑 DARK RED (no blue ❌)
    else if (theme === "dark") {
      root.style.setProperty("--bg", "#0f0204");
      root.style.setProperty("--card", "#22070f");
      root.style.setProperty("--text", "#fce7f3");
      root.style.setProperty("--primary", "#9f1239"); // strong red
      root.style.setProperty("--accent", "#fb7185");  // soft red
      root.style.setProperty("--border", "#3f0a14");
      root.style.setProperty("--glass", "blur(8px)");
    }

    // 🌸 LIGHT RED (Flipkart style but red tone)
    else {
      root.style.setProperty("--bg", "#fff1f2");
      root.style.setProperty("--card", "#ffe4e6");
      root.style.setProperty("--text", "#3f0a14");
      root.style.setProperty("--primary", "#e11d48");
      root.style.setProperty("--accent", "#fecdd3");
      root.style.setProperty("--border", "#fda4af");
      root.style.setProperty("--glass", "blur(4px)");
    }
  }, [theme]);

  // 🔥 Smooth transition
  useEffect(() => {
    document.body.style.transition =
      "background 0.4s ease, color 0.4s ease";
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};