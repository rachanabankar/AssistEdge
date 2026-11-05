import { useState } from "react";
import Card from "../common/Card";

const BOUNCE_DOT_CLASS = "w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce";

export default function ManualConversationPanel({
  messages = [],
  onSendCustomerMessage,
  onLogAgentReply,
  isLoading,
}) {
  return (
    <Card accent="blue">
      <div className="flex flex-col h-full min-h-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Conversation
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Manage your live customer interaction
            </p>
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Manual Mode
          </span>
        </div>

        {/* Conversation History */}
        <div className="flex-1 min-h-[180px] max-h-[min(42vh,420px)] overflow-y-auto space-y-4 pr-2 mb-5">
          {messages.length === 0 ? (
            <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                <svg
                  className="w-7 h-7 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                    d="M8 10h8M8 14h5m-9 6l3.5-3H18a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <h4 className="text-sm font-semibold text-gray-700">
                No messages yet
              </h4>

              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Paste the customer's message below to receive
                AI-powered coaching suggestions.
              </p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isAgent = m.sender === "agent";

              return (
                <div
                  key={i}
                  className={`flex ${
                    isAgent ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      isAgent
                        ? "bg-indigo-50 border border-indigo-100 rounded-br-sm"
                        : "bg-white border border-gray-200 rounded-bl-sm"
                    }`}
                  >
                    <p
                      className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${
                        isAgent
                          ? "text-indigo-600"
                          : "text-gray-500"
                      }`}
                    >
                      {isAgent ? "You · Agent" : "Customer"}
                    </p>

                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                      {m.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
                <p className="text-xs text-indigo-600 font-medium">
                  AI is analyzing the conversation...
                </p>
                <div className="flex gap-1 mt-2">
                  <span className={BOUNCE_DOT_CLASS} />
                  <span className={`${BOUNCE_DOT_CLASS} [animation-delay:150ms]`} />
                  <span className={`${BOUNCE_DOT_CLASS} [animation-delay:300ms]`} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Message Input */}
        <div className="border-t border-gray-100 pt-4">
          <CustomerInput
            onSubmit={onSendCustomerMessage}
            isLoading={isLoading}
          />

          {/* Agent Reply Input */}
          <AgentInput onSubmit={onLogAgentReply} />
        </div>

      </div>
    </Card>
  );
}

/* Customer Input */
function CustomerInput({ onSubmit, isLoading }) {
  const [value, setValue] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSubmit(value.trim());
    setValue("");
  };

  return (
    <form onSubmit={submit} className="mb-4">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
        Customer Message
        <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
          AI Analysis
        </span>
      </label>

      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste the customer's actual message here..."
          rows={2}
          maxLength={2000}
          disabled={isLoading}
          className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
        />

        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="sm:self-stretch rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold px-6 py-3 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      <p className="text-[11px] text-gray-400 mt-1.5">
        Customer messages are analyzed by the AI coaching pipeline.
      </p>
    </form>
  );
}

/* Agent Reply Input */
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
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        Your Reply
      </label>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter the response you actually gave..."
          className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />

        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold px-5 py-3 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Reply
        </button>
      </div>

      <p className="text-[11px] text-gray-400 mt-1.5">
        Records your actual reply without triggering AI analysis.
      </p>
    </form>
  );
}
