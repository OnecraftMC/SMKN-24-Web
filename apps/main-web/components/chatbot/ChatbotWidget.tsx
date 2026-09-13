"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/types";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: "bot", text: "Halo! Ada yang bisa saya bantu terkait PPDB, kurikulum, atau fasilitas sekolah?" },
  ]);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const newMessage: ChatMessage = { id: Date.now(), sender: "user", text };
    setMessages(prev => [...prev, newMessage]);
    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: "bot", text: "Baik, pertanyaan anda sedang di proses." },
      ]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden flex flex-col max-h-[500px]">
          <div className="bg-primary text-surface p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
              <span className="font-bold">Asisten AI SMKN 24</span>
            </div>
            <button onClick={toggleChat} className="text-surface hover:text-secondary-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <ChatMessages messages={messages} />
          </div>
          <div className="border-t border-surface-container p-2">
            <ChatInput onSend={sendMessage} />
          </div>
        </div>
      )}
      <button
        onClick={toggleChat}
        className="w-14 h-14 rounded-full bg-primary text-surface shadow-lg flex items-center justify-center hover:bg-primary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[28px]">{isOpen ? "close" : "chat"}</span>
      </button>
    </div>
  );
}
