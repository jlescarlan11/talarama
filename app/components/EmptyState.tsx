import Link from "next/link";
interface EmptyStateProps { title: string; description: string; href?: string; action?: string }
export default function EmptyState({ title, description, href, action }: EmptyStateProps) {
  return <section className="surface-panel py-12 px-6 text-center" aria-label={title}>
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    <p className="mx-auto mt-3 max-w-prose text-base-content/75">{description}</p>
    {href && action && <Link href={href} className="btn btn-primary mt-6">{action}</Link>}
  </section>;
}
