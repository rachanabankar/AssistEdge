import { Link } from "react-router-dom";

export default function LegalPageLayout({ title, children, otherPage, otherTitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-slate-700">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <Link to="/" className="flex items-center gap-3 font-bold text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-lg text-white" aria-hidden="true">A</span>
          <span className="text-xl">AssistEdge</span>
        </Link>
        <Link to="/" className="text-sm font-medium text-indigo-700 hover:underline">Back to home</Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-indigo-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: November 12, 2026</p>
        <div className="mt-8 space-y-8 text-base leading-7 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-indigo-900 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </main>
      <footer className="mx-auto flex max-w-3xl flex-wrap justify-between gap-4 border-t border-indigo-100 px-6 py-8 text-sm">
        <span>AssistEdge · Internship / demonstration project</span>
        <Link to={otherPage} className="font-medium text-indigo-700 hover:underline">{otherTitle}</Link>
      </footer>
    </div>
  );
}
