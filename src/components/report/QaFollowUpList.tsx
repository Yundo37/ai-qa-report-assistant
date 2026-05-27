export function QaFollowUpList({ followUps }: { followUps: string[] }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-6">
      <h2 className="text-base font-semibold text-zinc-100">
        QA 코멘트 / 후속 조치 (QA Comment / Follow-up)
      </h2>

      {followUps.length > 0 ? (
        <ul className="mt-5 space-y-3 text-sm leading-6 text-zinc-300">
          {followUps.map((followUp) => (
            <li key={followUp} className="border-l border-zinc-700 pl-4">
              {followUp}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">
          추출된 QA 코멘트 / 후속 조치가 없습니다.
        </p>
      )}
    </section>
  );
}
