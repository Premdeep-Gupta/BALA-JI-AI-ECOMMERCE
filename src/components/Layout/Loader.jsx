import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[var(--bg)]">
      <div className="relative flex flex-col items-center">
        {/* Animated Spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-[var(--border)] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-[var(--primary)] rounded-full animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <p className="mt-4 text-[var(--text)] font-medium tracking-widest animate-pulse text-xs">
          LOADING...
        </p>
      </div>
    </div>
  );
};

export default Loader;