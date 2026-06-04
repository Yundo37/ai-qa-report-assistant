import type { MessageState } from "@/types/report";

export function MessagePanel({ message }: { message: Exclude<MessageState, null> }) {
  return (
    <div
      className={`mt-6 rounded-2xl border p-5 ${
        message.type === "error"
          ? "border-red-500/40 bg-red-950/30"
          : "border-emerald-500/40 bg-emerald-950/30"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          message.type === "error" ? "text-red-300" : "text-emerald-300"
        }`}
      >
        {message.title}
      </p>
      <ul className="mt-3 space-y-2 text-sm text-zinc-300">
        {message.items.map((item, index) => (
          <li key={index}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
