"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bot, UserRound } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
              <Bot aria-hidden className="h-4 w-4" />
            </div>
          )}
          <div
            className={`max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
              msg.sender === "bot"
                ? "rounded-bl-md border border-outline-variant/40 bg-surface-container-lowest text-on-surface"
                : "rounded-br-md bg-primary text-on-primary"
            }`}>
            {msg.sender === "bot" ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h3 className="mb-2 text-base font-bold">{children}</h3>,
                  h2: ({ children }) => <h4 className="mb-2 text-sm font-bold">{children}</h4>,
                  h3: ({ children }) => <h5 className="mb-2 font-bold">{children}</h5>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
                  li: ({ children }) => <li className="pl-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  blockquote: ({ children }) => (
                    <blockquote className="my-2 border-l-2 border-outline-variant pl-3 text-on-surface-variant">
                      {children}
                    </blockquote>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      className="break-all font-semibold text-secondary underline underline-offset-2"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code className="rounded bg-surface-container px-1 py-0.5 font-mono text-[0.9em]">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="my-2 overflow-x-auto rounded-lg bg-surface-container p-2 font-mono text-xs">
                      {children}
                    </pre>
                  ),
                  hr: () => <hr className="my-2 border-outline-variant" />,
                }}
              >
                {msg.text}
              </ReactMarkdown>
            ) : (
              msg.text
            )}
          </div>
          {msg.sender === "user" && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-sm">
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
            <Bot aria-hidden className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 rounded-[22px] rounded-bl-md bg-surface-container-lowest ring-1 ring-surface-container px-4 py-3 shadow-sm">
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
