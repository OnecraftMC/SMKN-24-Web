"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-[26px] bg-surface-container-lowest px-2 py-2 ring-1 ring-surface-container transition focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
      <input
        type="text"
        value={input}
        disabled={disabled}
        required
        maxLength={2000}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        placeholder="Tanyakan sesuatu..."
        aria-label="Tulis pertanyaan untuk Asisten AI"
        className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/70 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        aria-label="Kirim pesan"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary transition hover:bg-primary-container focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Send aria-hidden className="h-4 w-4" />
      </button>
    </form>
  );
}
