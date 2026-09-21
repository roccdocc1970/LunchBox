import { Check, X } from 'lucide-react'

const TOOL_LABELS = {
  update_student_status: 'Update student status',
  log_incident: 'Log incident',
}

/**
 * The only write-facing template — always this same fixed layout,
 * regardless of which simple write tool triggered it. Nothing is mutated
 * until the human clicks Confirm.
 */
export default function ConfirmAction({ pendingAction, onConfirm, onCancel, confirming, error }) {
  if (!pendingAction) return null
  const { tool, input } = pendingAction

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2">
      <p className="font-semibold text-amber-900 text-sm m-0 mb-2">{TOOL_LABELS[tool] || tool}</p>
      <div className="flex flex-col gap-1 mb-3">
        {Object.entries(input || {}).map(([key, value]) => (
          <div key={key} className="flex justify-between text-xs">
            <span className="text-amber-700">{key}</span>
            <span className="text-amber-900 font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={confirming}
          className="bg-amber-600 text-white border-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-70 hover:bg-amber-700 flex items-center gap-1"
        ><Check size={12} />{confirming ? 'Applying…' : 'Confirm'}</button>
        <button
          onClick={onCancel}
          disabled={confirming}
          className="bg-white text-gray-700 border border-gray-300 rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer hover:bg-gray-50 flex items-center gap-1"
        ><X size={12} />Cancel</button>
      </div>
    </div>
  )
}
