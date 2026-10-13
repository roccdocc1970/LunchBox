import { Upload, Trash2, FileText, Check, AlertTriangle } from 'lucide-react'
import { usePolicies } from './hooks/usePolicies'
import { POLICY_FILE_EXTENSIONS } from './domain/policies'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none text-sm'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

/** Settings → Policies tab: upload and manage the policy documents the "Ask LunchBox" chat answers from. */
export default function PoliciesPanel({ user, primaryColor }) {
  const p = usePolicies(user)

  return (
    <div className="grid gap-6">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-lg font-semibold text-gray-800 mt-0 mb-2 flex items-center gap-2">
          <FileText size={18} style={{ color: primaryColor }} />Policy Documents
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Upload your handbook and policies. "Ask LunchBox" then answers policy questions from these documents and names the
          source. Uploading a document with the same title replaces the earlier version. Markdown (.md) and plain text (.txt) only for now.
        </p>

        <div className="grid gap-5">
          <div>
            <label className={labelCls}>Choose a file</label>
            <input
              type="file"
              accept={POLICY_FILE_EXTENSIONS.join(',')}
              onChange={e => p.chooseFile(e.target.files?.[0])}
              className="text-sm"
            />
            {p.filename && <p className="text-xs text-gray-500 mt-1">Loaded: {p.filename}</p>}
          </div>

          <div>
            <label className={labelCls}>Title</label>
            <input value={p.title} onChange={e => p.setTitle(e.target.value)} placeholder="e.g. Parent Handbook 2026" className={fieldCls} />
            <p className="text-xs text-gray-400 mt-1">Shown when the assistant cites this document.</p>
          </div>

          <div>
            <label className={labelCls}>…or paste the text</label>
            <textarea
              value={p.text}
              onChange={e => p.setText(e.target.value)}
              rows={8}
              placeholder={'# Parent Handbook\n\n## Late pickup\n\nFamilies are expected to collect their children by…'}
              className={`${fieldCls} resize-y font-mono`}
            />
            <p className="text-xs text-gray-400 mt-1">Headings (lines starting with #) help the search find the right section.</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 flex-wrap">
          <button
            onClick={p.submit}
            disabled={p.uploading}
            className="text-white border-0 rounded-lg px-6 py-3 font-bold cursor-pointer text-sm disabled:opacity-70 hover:opacity-90 transition-opacity flex items-center gap-2"
            style={{ background: primaryColor }}
          >
            <Upload size={16} />{p.uploading ? 'Processing…' : 'Upload document'}
          </button>
          {p.uploading && <span className="text-gray-500 text-sm">This can take a moment, especially the first time while the search model loads.</span>}
          {p.success && <span className="text-green-700 text-sm font-medium flex items-center gap-1"><Check size={14} />{p.success}</span>}
          {p.error && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle size={14} />{p.error}</span>}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-lg font-semibold text-gray-800 mt-0 mb-4">Documents on file</h3>
        {p.loading ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : p.documents.length === 0 ? (
          <p className="text-gray-400 text-sm">No policy documents yet. Upload one above.</p>
        ) : (
          <div className="grid gap-2">
            {p.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between gap-4 border border-gray-100 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-800 text-sm truncate">{doc.title}</div>
                  <div className="text-xs text-gray-500">
                    {doc.chunk_count} sections · added {new Date(doc.created_at).toLocaleDateString()}{doc.filename ? ` · ${doc.filename}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => { if (window.confirm(`Remove "${doc.title}"? The assistant will no longer answer from it.`)) p.remove(doc) }}
                  title="Remove this document"
                  className="bg-white text-red-500 border border-red-300 rounded-lg px-3 py-1.5 cursor-pointer text-xs hover:bg-red-50 flex items-center gap-1 shrink-0"
                >
                  <Trash2 size={13} />Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
