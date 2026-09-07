"use client";

import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
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
        onChange={(e) => setInput(e.target.value)}
        placeholder="Tanyakan sesuatu..."
        className="flex-1 text-sm rounded-xl border border-surface-container bg-surface-container-low px-3 py-2 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button type="submit" className="p-2 rounded-full bg-primary text-surface hover:bg-primary-container transition-colors">
        <span className="material-symbols-outlined text-[20px]">send</span>
      </button>
    </form>
  );
}
