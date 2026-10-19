export default function MovieLoading() {
 return <section role="status" aria-label="Loading movie details" className="max-w-6xl mx-auto space-y-8 py-8"><div className="skeleton h-6 w-40" /><div className="grid md:grid-cols-[240px_1fr] gap-8 rounded-2xl bg-base-200 p-5 md:p-10"><div className="skeleton aspect-[2/3] w-40 md:w-full" /><div className="space-y-6"><div className="skeleton h-12 w-3/4" /><div className="skeleton h-24 w-full" /><div className="skeleton h-12 w-full" /></div></div><span className="sr-only">Loading movie details…</span></section>;
}
