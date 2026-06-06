import type { ReactNode } from "react";

type InputStepCardProps = {
  step: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function InputStepCard({
  step,
  title,
  description,
  children,
}: InputStepCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start">
        <span className="inline-flex w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {step}
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            {title}
          </h2>
          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
