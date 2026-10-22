import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <section className="mx-auto grid min-h-[55vh] max-w-xl place-items-center text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-brand">
          <SearchX className="size-7" aria-hidden="true" />
        </span>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-brand">
          Page not found
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          This page wandered off.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          The link may be out of date. Head back to your dashboard to find your
          way.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
          to="/"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}
