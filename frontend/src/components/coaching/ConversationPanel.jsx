import { useState } from "react";
import Card from "../common/Card";

const SUBHEADER_CLASS = "text-[10px] font-semibold uppercase tracking-wide";
const TYPING_DOT_CLASS = "h-1.5 w-1.5 rounded-full bg-[#0F766E] animate-bounce";

export default function ConversationPanel({ messages = [], onSend, isLoading }) {
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    const text = draft.trim();
    if (!text || isLoading) return;
    onSend?.(text);
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <Card title="Conversation">
      <div className="space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.sender === "agent" ? "flex justify-end" : ""}
          >
            <div
              className={`max-w-[85%] rounded-xl border shadow-sm px-4 py-3 transition-colors duration-200 ${
                m.sender === "agent"
                  ? "bg-[#F3F4FF] border-[#D9DDFF] text-gray-800"
                  : "bg-[#F1FBFC] border-[#D7F2F5] text-gray-800"
              }`}
            >
              <div
                className={`mb-1 ${SUBHEADER_CLASS} ${
                  m.sender === "agent"
                    ? "text-[#4338CA]"
                    : "text-[#0F766E]"
                }`}
              >
                {m.sender === "agent" ? "You (Agent)" : "Customer"}
              </div>

              <div className="text-sm leading-6">
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && lastMessage?.sender === "agent" && (
          <div>
            <div className="inline-flex max-w-[85%] items-center gap-2 rounded-xl border border-[#D7F2F5] bg-[#F1FBFC] px-4 py-3 shadow-sm">
              <span className={`${SUBHEADER_CLASS} text-[#0F766E]`}>
                Customer is typing
              </span>

              <span className="flex gap-1">
                <span className={`${TYPING_DOT_CLASS} [animation-delay:-0.3s]`} />
                <span className={`${TYPING_DOT_CLASS} [animation-delay:-0.15s]`} />
                <span className={TYPING_DOT_CLASS} />
              </span>
            </div>
          </div>
        )}
      </div>

      {onSend && (
        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Type your reply as the agent..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
          />

          <button
            onClick={handleSend}
            disabled={isLoading || !draft.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      )}
    </Card>
  );
}
