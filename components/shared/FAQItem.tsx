"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FAQContent } from "@/constants/faq";

export function FAQItem({ question, answer }: FAQContent) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="border-b border-gray-100 py-4 last:border-b-0">
      <button
        type="button"
        className="focus-visible:ring-primary group flex w-full items-center justify-between gap-4 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="group-hover:text-primary text-base font-medium text-gray-900 transition-colors">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <p
          id={panelId}
          className="animate-fade-in-up mt-3 text-sm text-gray-600"
        >
          {answer}
        </p>
      )}
    </div>
  );
}
