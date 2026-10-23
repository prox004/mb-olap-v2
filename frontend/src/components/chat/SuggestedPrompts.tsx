"use client";

import React, { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/utils/apiClient";

export interface SuggestedPromptItem {
  id: number;
  category: string;
  prompt: string;
}

interface SuggestedPromptsProps {
  onSelectPrompt: (promptText: string) => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelectPrompt }) => {
  const [prompts, setPrompts] = useState<SuggestedPromptItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/chat/suggested-prompts`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setPrompts(data.data);
        }
      })
      .catch(() => {
        // Fallback default suggestions if backend unready
        setPrompts([
          { id: 1, category: "Executive Summary", prompt: "Show an executive summary of monthly sales performance" },
          { id: 2, category: "Store Rankings", prompt: "Compare total sales and profits across all stores" },
          { id: 3, category: "Top Departments", prompt: "Which departments generate the highest sales?" },
          { id: 4, category: "Stock Overview", prompt: "What is our current stock valuation and weeks of cover?" },
          { id: 5, category: "Supplier Return", prompt: "Which suppliers deliver the best profit return on stock (GMROI)?" },
          { id: 6, category: "Best Sellers", prompt: "List top 10 best-selling items by quantity sold" }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-gray-400 py-2">Loading suggested questions...</div>;
  }

  return (
    <div className="my-4">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
        Suggested Business Questions
      </span>
      <div className="flex flex-wrap gap-2">
        {prompts.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectPrompt(item.prompt)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs font-medium hover:border-brand-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 transition-all text-left shadow-2xs"
          >
            💡 {item.prompt}
          </button>
        ))}
      </div>
    </div>
  );
};
