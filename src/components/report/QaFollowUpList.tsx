export function QaFollowUpList({ followUps }: { followUps: string[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6">
      <h2 className="text-base font-semibold text-slate-950">
        Full QA Comment / Follow-up
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        협의 사항과 후속 확인이 필요한 전체 항목입니다.
      </p>

      {followUps.length > 0 ? (
        <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
          {followUps.map((followUp) => (
            <li
              key={followUp}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              {followUp}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          표시할 QA Comment가 없습니다.
        </p>
      )}
    </section>
  );
}
