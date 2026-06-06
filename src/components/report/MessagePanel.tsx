import type { MessageState } from "@/types/report";

export function MessagePanel({ message }: { message: Exclude<MessageState, null> }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        message.type === "error"
          ? "border-red-200 bg-red-50"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          message.type === "error" ? "text-red-700" : "text-emerald-700"
        }`}
      >
        {message.title}
      </p>
      {message.items.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {message.items.map((item, index) => (
            <li key={index}>- {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
