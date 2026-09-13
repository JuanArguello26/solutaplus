"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface TypewriterTextProps {
  text: string;
}

const CHAR_INTERVAL_MS = 55;

// Componente cliente aislado (no todo el Hero) para que el resto siga
// siendo Server Component. El H1 que lo envuelve lleva `aria-label` con
// el texto completo y este `<span>` va `aria-hidden`, así que lectores
// de pantalla reciben el texto real de inmediato sin esperar a que
// termine de "escribirse".
export function TypewriterText({ text }: TypewriterTextProps) {
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleChars(text.length);
      return;
    }

    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setVisibleChars(count);
      if (count >= text.length) clearInterval(interval);
    }, CHAR_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [text]);

  const done = visibleChars >= text.length;

  return (
    <span aria-hidden="true">
      {text.slice(0, visibleChars)}
      <span
        className={`ml-0.5 inline-block w-[2px] bg-current align-middle ${
          done ? "opacity-0" : "animate-caret-blink"
        }`}
        style={{ height: "0.85em" }}
      />
      <Heart
        className={`ml-1 inline h-[0.75em] w-[0.75em] -translate-y-0.5 fill-red-500 text-red-500 transition-opacity duration-300 ${
          done ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
