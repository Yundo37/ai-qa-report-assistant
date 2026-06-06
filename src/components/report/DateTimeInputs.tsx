"use client";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  index.toString().padStart(2, "0")
);

const inputClassName =
  "min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

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
      <label className="mb-2 block text-xs font-medium text-slate-500">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onClick={(event) => openDatePicker(event.currentTarget)}
          onChange={(event) => onDateChange(event.target.value)}
          className={`${inputClassName} w-40 cursor-pointer`}
        />
        <select
          value={hour}
          onChange={(event) => onHourChange(event.target.value)}
          className={`${inputClassName} w-20`}
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
          className={`${inputClassName} w-20`}
        />
      </div>
    </div>
  );
}
