"use client";

import React, { useState } from "react";
import { ChatMessageList, ChatMessage } from "./ChatMessageList";
import { SuggestedPrompts } from "./SuggestedPrompts";

export const FloatingChatDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "👋 Hi! I am your Wren AI GenBI Assistant. Ask me any natural language question about store revenue, department sales, stock cover, or GMROI performance.",
      timestamp: ""
    }
  ]);

  const handleSend = async (promptToSend?: string) => {
    const queryText = (promptToSend || inputPrompt).trim();
    if (!queryText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/chat/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: queryText })
      });

      const json = await res.json();
      if (json.success && json.data) {
        const payload = json.data;
        const assistantMsg: ChatMessage = {
          id: `assistant_${Date.now()}`,
          sender: "assistant",
          text: payload.summary,
          generated_sql: payload.generated_sql,
          visualization_type: payload.visualization_type,
          columns: payload.columns,
          data: payload.data,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(json.message || "Failed to execute query.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unable to reach Wren AI backend.";
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        sender: "assistant",
        text: `⚠️ Query Error: ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 group"
        title="Open Wren AI GenBI Assistant"
      >
        <span className="text-xl font-bold">🤖</span>
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white text-[10px] font-bold flex items-center justify-center text-white">
          AI
        </span>
      </button>

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Slide-over Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-gray-50 dark:bg-gray-950 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-sm">
              Wren
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                Wren AI GenBI Assistant
              </h3>
              <span className="text-[11px] text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                DuckDB Context Engine Active
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          <ChatMessageList messages={messages} isLoading={isLoading} />
          {messages.length <= 2 && (
            <SuggestedPrompts onSelectPrompt={(p) => handleSend(p)} />
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask a retail question (e.g. Top 5 stores by sales)..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-sm transition-colors flex items-center justify-center shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
