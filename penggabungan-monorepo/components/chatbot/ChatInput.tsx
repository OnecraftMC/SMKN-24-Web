"use client";

import { useState } from "react";

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
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={input}
        disabled={disabled}
        required
        maxLength={2000}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        placeholder="Tanyakan sesuatu..."
        className="flex-1 text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button type="submit" disabled={disabled} aria-label="Kirim pesan" className="p-2 rounded-full bg-primary text-surface hover:bg-primary-container transition-colors disabled:opacity-50">
        <span className="material-symbols-outlined text-[20px]">send</span>
      </button>
    </form>
  );
}
