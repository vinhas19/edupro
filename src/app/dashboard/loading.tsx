export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-[var(--muted)] animate-pulse" />
        <div className="h-8 w-64 max-w-full rounded bg-[var(--muted)] animate-pulse" />
        <div className="h-4 w-48 rounded bg-[var(--muted)] animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[12px] bg-[var(--muted)] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-[12px] bg-[var(--muted)] animate-pulse" />
        <div className="h-64 rounded-[12px] bg-[var(--muted)] animate-pulse" />
      </div>
    </div>
  );
}
