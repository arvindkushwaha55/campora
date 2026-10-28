import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f7f9] px-4 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pink-200 text-2xl font-extrabold text-rose-900">
        C
      </span>
      <h1 className="text-2xl font-extrabold text-slate-900">Page not found</h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-slate-500">
        This page does not exist on Campora. The link may be wrong, or the page may have
        moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        Back to the campus feed
      </Link>
      <p className="mt-4 text-xs text-slate-400">
        Campora — a personal mini project, Work in Progress.
      </p>
    </main>
  );
}
