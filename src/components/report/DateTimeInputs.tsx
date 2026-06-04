"use client";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  index.toString().padStart(2, "0")
);

function openDatePicker(input: HTMLInputElement) {
  if (typeof input.showPicker === "function") {
    input.showPicker();
  }
}

export function DateTimeInputs({
  label,
  date,
  hour,
  minute,
  onDateChange,
  onHourChange,
  onMinuteChange,
}: {
  label: string;
  date: string;
  hour: string;
  minute: string;
  onDateChange: (date: string) => void;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
}) {
  return (
    <div className="shrink-0">
      <label className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onClick={(event) => openDatePicker(event.currentTarget)}
          onChange={(event) => onDateChange(event.target.value)}
          className="min-h-11 w-40 cursor-pointer rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-400"
        />
        <select
          value={hour}
          onChange={(event) => onHourChange(event.target.value)}
          className="min-h-11 w-20 rounded-xl border border-zinc-700 bg-zinc-950 px-2 text-sm text-white outline-none focus:border-zinc-400"
        >
          {HOUR_OPTIONS.map((hourOption) => (
            <option key={hourOption} value={hourOption}>
              {hourOption}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          max="59"
          value={minute}
          onChange={(event) => onMinuteChange(event.target.value)}
          className="min-h-11 w-20 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-400"
        />
      </div>
    </div>
  );
}
