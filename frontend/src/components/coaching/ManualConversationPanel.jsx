import { useState } from "react";
import Card from "../common/Card";

export default function ManualConversationPanel({
  messages,
  onSendCustomerMessage,
  onLogAgentReply,
  isLoading,
}) {
  return (
    <Card accent="blue">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Conversation</h3>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1 mb-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 italic">
            Paste the customer's first message below to begin.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.sender === "agent" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.sender === "agent"
                  ? "bg-indigo-50 text-gray-800"
                  : "bg-gray-50 text-gray-800"
              }`}
            >
              <p
                className={`text-[10px] uppercase tracking-wide mb-0.5 font-semibold ${
                  m.sender === "agent" ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                {m.sender === "agent" ? "You (Agent)" : "Customer"}
              </p>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      {/* Customer message input — this one hits the backend pipeline */}
      <CustomerInput onSubmit={onSendCustomerMessage} isLoading={isLoading} />

      {/* Agent reply input — local log only, no pipeline call */}
      <AgentInput onSubmit={onLogAgentReply} />
    </Card>
  );
}

function CustomerInput({ onSubmit, isLoading }) {
  const [value, setValue] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  };
  return (
    <form onSubmit={submit} className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        Customer said...
      </label>
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste the real customer message here..."
          rows={2}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700
                     placeholder:text-gray-400 focus:outline-none focus:ring-2
                     focus:ring-indigo-500 focus:border-transparent resize-none"
        />
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="rounded-xl bg-indigo-600 text-white text-sm font-medium px-5
                     hover:bg-indigo-700 transition-colors disabled:opacity-50
                     disabled:cursor-not-allowed shrink-0"
        >
          {isLoading ? "..." : "Analyze"}
        </button>
      </div>
    </form>
  );
}

function AgentInput({ onSubmit }) {
  const [value, setValue] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  };
  return (
    <form onSubmit={submit}>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        My reply
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Log what you actually replied to the customer..."
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700
                     placeholder:text-gray-400 focus:outline-none focus:ring-2
                     focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-xl border border-gray-200 text-gray-700 text-sm font-medium px-5
                     hover:bg-gray-50 transition-colors disabled:opacity-50
                     disabled:cursor-not-allowed shrink-0"
        >
          Save Reply
        </button>
      </div>
    </form>
  );
}