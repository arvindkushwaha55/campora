import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f6f7f9] px-4 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-200 to-rose-300 shadow-sm ring-1 ring-rose-900/10 text-2xl font-extrabold text-rose-900">
        C
      </span>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Page not found</h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
        This page does not exist on Campora. The link may be wrong, or the page may have
        moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:from-indigo-700 hover:to-violet-700"
      >
        Back to the campus feed
      </Link>
      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        Campora — a personal mini project, Work in Progress.
      </p>
    </main>
  );
}
