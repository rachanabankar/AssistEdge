import { useServerWake } from '../hooks/useServerWake'

export default function WakingServerBanner() {
  const status = useServerWake()
  if (status !== 'waking') return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex justify-center px-4" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 shadow-lg shadow-purple-200/40">
        <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-purple-600 motion-reduce:animate-none" />
        <span>Waking up the server... this can take up to a minute on first load.</span>
      </div>
    </div>
  )
}
