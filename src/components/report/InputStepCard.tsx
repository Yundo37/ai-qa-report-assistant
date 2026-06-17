import type { ReactNode } from "react";

type InputStepCardProps = {
  id?: string;
  className?: string;
  step: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function InputStepCard({
  id,
  className = "",
  step,
  title,
  description,
  children,
}: InputStepCardProps) {
  return (
    <section
      id={id}
      className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="mb-5 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {step}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            {title}
          </h2>
        </div>
        {description && (
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
