"use client";

import React, { useState } from "react";
import { ChatMessageList, ChatMessage } from "@/components/chat/ChatMessageList";
import { SuggestedPrompts } from "@/components/chat/SuggestedPrompts";

export default function OlapAssistantPage() {
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "👋 Welcome to the Wren AI GenBI Assistant workspace! Ask any natural language question to generate governed DuckDB SQL, dynamic charts, and executive insights.",
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
    <div className="flex flex-col h-[calc(100vh-140px)] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden">
      {/* Workspace Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white font-bold flex items-center justify-center text-lg">
            Wren
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">
              Wren AI GenBI Conversational Workspace
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Grounded in Wren AI 5-Layer MDL Engine & DuckDB Analytical Warehouse
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 text-xs font-semibold border border-green-200 dark:border-green-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Engine Online
        </span>
      </div>

      {/* Main Conversational Feed */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        <ChatMessageList messages={messages} isLoading={isLoading} />
        <SuggestedPrompts onSelectPrompt={(p) => handleSend(p)} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask any natural language question (e.g. 'What are the top 5 departments by GMROI?')..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-xs shrink-0 flex items-center gap-2"
          >
            <span>Ask AI</span>
            <span>✨</span>
          </button>
        </form>
      </div>
    </div>
  );
}
