import { User, Play } from "lucide-react";
import Card from "../common/Card";

export default function ReplayConversationPanel({ messages, currentTurnIndex }) {
  if (!messages || messages.length === 0) {
    return (
      <Card title="Conversation Transcript" accent="purple">
        <p className="text-sm text-gray-400 italic">
          Select a session above to view its transcript.
        </p>
      </Card>
    );
  }

  const visibleMessages = messages.slice(0, currentTurnIndex + 1);

  return (
    <Card title="Conversation Transcript" accent="purple">
      <div className="space-y-0 max-h-[420px] overflow-y-auto pr-1">
        {visibleMessages.map((m, i) => {
          const isCurrent = i === currentTurnIndex;
          const isAgent = m.sender === "agent";
          const isLast = i === visibleMessages.length - 1;

          const iconBg = isCurrent
            ? "bg-emerald-500 ring-4 ring-emerald-100"
            : isAgent
            ? "bg-indigo-500"
            : "bg-emerald-500";

          return (
            <div key={m.id ?? i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${iconBg}`}>
                  {isCurrent ? (
                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
              </div>

              <div className="flex-1 pb-4">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm transition-colors border ${
                    isCurrent
                      ? "bg-emerald-50 border-emerald-200 shadow-sm"
                      : isAgent
                      ? "bg-indigo-50/60 border-indigo-100/70"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${isAgent ? "text-indigo-600" : "text-emerald-700"}`}>
                      {isAgent ? "You (Agent)" : "Customer"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {m.timestamp
                        ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Current turn
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 leading-relaxed">{m.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2.5 mt-4">
        <span className="text-indigo-500 text-sm">ⓘ</span>
        <p className="text-xs text-indigo-700">
          This is a read-only replay. No new analysis is being performed.
        </p>
      </div>
    </Card>
  );
}