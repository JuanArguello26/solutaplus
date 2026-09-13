"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, X } from "lucide-react";
import { FAQItem } from "@/components/shared/FAQItem";
import { FAQ } from "@/constants/faq";

export function FAQFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="faq-bot-heading"
          className="animate-fade-in-up fixed right-6 bottom-[168px] z-50 flex max-h-[70vh] w-[calc(100vw-3rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        >
          <div className="bg-primary-light flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 id="faq-bot-heading" className="font-semibold text-gray-900">
              Preguntas frecuentes
            </h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar preguntas frecuentes"
              className="focus-visible:ring-primary rounded p-1 text-gray-500 hover:bg-white/60 focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-y-auto px-5">
            {FAQ.map((item) => (
              <FAQItem key={item.question} {...item} />
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={
          isOpen ? "Cerrar preguntas frecuentes" : "Abrir preguntas frecuentes"
        }
        aria-expanded={isOpen}
        className="bg-primary hover:bg-primary-hover focus-visible:ring-primary fixed right-6 bottom-24 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Bot className="h-7 w-7" aria-hidden="true" />
      </button>
    </>
  );
}
