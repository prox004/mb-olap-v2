"use client";

import React from "react";
import { DynamicReportRenderer } from "./DynamicReportRenderer";
import { SqlInspectorAccordion } from "./SqlInspectorAccordion";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  generated_sql?: string;
  visualization_type?: string;
  columns?: string[];
  data?: Record<string, unknown>[];
  timestamp: string;
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages, isLoading }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col gap-4 py-4">
      {messages.map((msg) => {
        const isUser = msg.sender === "user";

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 max-w-[85%] ${
              isUser ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar Icon */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isUser
                  ? "bg-brand-500 text-white"
                  : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border border-gray-700"
              }`}
            >
              {isUser ? "U" : "Wren"}
            </div>

            {/* Bubble Container */}
            <div
              className={`rounded-2xl p-4 text-sm ${
                isUser
                  ? "bg-brand-500 text-white rounded-tr-none shadow-xs"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none shadow-xs"
              }`}
            >
              {/* Message Summary Text */}
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {/* Render Reports for Assistant Messages */}
              {!isUser && msg.data && msg.columns && msg.visualization_type && (
                <DynamicReportRenderer
                  visualizationType={msg.visualization_type}
                  columns={msg.columns}
                  data={msg.data}
                />
              )}

              {/* Render SQL Inspector Accordion */}
              {!isUser && msg.generated_sql && (
                <SqlInspectorAccordion sql={msg.generated_sql} />
              )}

              <span className={`text-[10px] block mt-1 ${isUser ? "text-brand-100 text-right" : "text-gray-400"}`}>
                {mounted ? (msg.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })) : ""}
              </span>
            </div>
          </div>
        );
      })}

      {/* Typing Spinner Indicator */}
      {isLoading && (
        <div className="flex items-center gap-3 mr-auto">
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
            Wren
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce delay-150" />
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce delay-300" />
            <span className="text-xs text-gray-400 ml-2 font-medium">Translating to DuckDB SQL...</span>
          </div>
        </div>
      )}
    </div>
  );
};
