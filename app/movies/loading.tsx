export default function MoviesLoading() {
 return <section role="status" aria-label="Loading movies" className="max-w-7xl mx-auto space-y-8 py-8"><div className="skeleton h-12 w-2/3 max-w-md" /><div className="skeleton h-24 w-full" /><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">{Array.from({length:6},(_,i)=><div key={i} className="skeleton aspect-[2/3]" />)}</div><span className="sr-only">Loading movies…</span></section>;
}
