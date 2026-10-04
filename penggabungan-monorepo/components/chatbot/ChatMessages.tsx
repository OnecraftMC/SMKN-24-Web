"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bot, UserRound } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isTyping?: boolean;
}

export default function ChatMessages({ messages, isTyping = false }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  return (
    <div
      role="log"
      aria-label="Percakapan dengan Asisten AI"
      aria-live="polite"
      className="space-y-4"
    >
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
          className={`flex w-full items-end gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.sender === "bot" && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
              <Bot aria-hidden className="h-4 w-4" />
            </div>
          )}
          <p
            className={`max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
              msg.sender === "bot"
                ? "rounded-bl-md border border-outline-variant/40 bg-surface-container-lowest text-on-surface"
                : "rounded-br-md bg-primary text-on-primary"
            }`}>
            {msg.text}
          </p>
          {msg.sender === "user" && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
              <UserRound aria-hidden className="h-4 w-4" />
            </div>
          )}
        </motion.div>
      ))}
      {isTyping && (
        <div
          className="flex items-end gap-2.5"
          role="status"
          aria-label="Asisten sedang menyiapkan jawaban"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
            <Bot aria-hidden className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 shadow-sm">
            {[0, 1, 2].map((dot) => (
              <motion.span
                key={dot}
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-secondary"
                animate={reduceMotion ? { opacity: 0.7 } : { opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
              />
            ))}
            <span className="sr-only">Asisten sedang menyiapkan jawaban</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
