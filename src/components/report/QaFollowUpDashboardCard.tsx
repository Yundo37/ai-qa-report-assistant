export function QaFollowUpDashboardCard({
  followUps,
}: {
  followUps: string[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        QA Follow-up
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
        QA Comment / Follow-up
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        QA Comment는 참고 / 협의 / 후속 확인 항목으로 하단에 별도 유지합니다.
      </p>

      {followUps.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {followUps.map((followUp) => (
            <li
              key={followUp}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
            >
              {followUp}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          추출된 QA Comment / Follow-up이 없습니다.
        </p>
      )}
    </section>
  );
}
