import type { ChatMessage } from "@/lib/types";

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender === "user" ? "justify-end" : ""}`}>
          {msg.sender === "bot" && (
            <div className="w-7 h-7 rounded-full bg-primary text-secondary-container flex items-center justify-center flex-shrink-0 text-sm mt-0.5 shadow-sm">
              <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            </div>
          )}
          <div className={`max-w-[82%] space-y-1 ${msg.sender === "user" ? "flex flex-col items-end" : ""}`}>
            <div className={`p-3 rounded-2xl text-body-sm text-[13px] leading-relaxed shadow-sm ${
              msg.sender === "bot"
                ? "bg-surface-container-lowest border border-surface-container text-on-surface rounded-tl-none"
                : "bg-primary text-surface rounded-tr-none"
            }`}>
              <p>{msg.text}</p>
            </div>
          </div>
          {msg.sender === "user" && (
            <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0 text-xs mt-0.5 font-bold shadow-sm">
              <span className="material-symbols-outlined text-[16px]">person</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
