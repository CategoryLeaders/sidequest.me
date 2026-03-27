'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ApiKey } from '@/lib/writings'

interface NewKeyResult {
  key: string   // shown once, then gone
  prefix: string
  label: string
  id: string
}

export default function ApiKeysEditor({ userId }: { userId: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<NewKeyResult | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchKeys = async () => {
    const { data } = await (supabase as any)
      .from('api_keys')
      .select('id, label, key_prefix, created_at, last_used_at, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false }) as { data: ApiKey[] | null }
    setKeys(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchKeys() }, [])

  const handleCreate = async () => {
    if (!newLabel.trim()) return
    setCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      const result = await res.json() as NewKeyResult
      setNewKey(result)
      setNewLabel('')
      await fetchKeys()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this key? Any site using it will lose access immediately.')) return
    setRevoking(id)
    setError(null)
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      await fetchKeys()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-head font-bold text-sm uppercase tracking-wide mb-1">API Keys</h3>
        <p className="text-xs text-ink/50">
          Issue keys to external sites that consume your writings API. Each key can be revoked
          independently. The full key is shown only once on creation.
        </p>
      </div>

      {/* New key shown once */}
      {newKey && (
        <div className="border-2 border-green-400 bg-green-50 rounded p-4">
          <p className="text-sm font-medium text-green-800 mb-2">
            ✓ Key created for <strong>{newKey.label}</strong> — copy it now, it won&apos;t be shown again.
          </p>
          <code className="block text-xs bg-bg-card border border-green-300 rounded px-3 py-2 font-mono break-all select-all">
            {newKey.key}
          </code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(newKey.key)}
            className="mt-2 text-xs text-green-700 underline hover:no-underline"
          >
            Copy to clipboard
          </button>
          <button
            type="button"
            onClick={() => setNewKey(null)}
            className="ml-4 text-xs text-green-700 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create new key */}
      <div className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Key label (e.g. Category Leaders)"
          className="flex-1 border border-ink/[var(--opacity-muted)]  px-3 py-2 text-sm outline-none focus:border-ink/40"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || !newLabel.trim()}
          className="bg-black text-white text-sm px-4 py-2  hover:bg-ink/80 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          {creating ? 'Creating…' : 'Generate key'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Key list */}
      {loading ? (
        <p className="text-sm text-ink/40">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-ink/40">No active keys. Generate one above.</p>
      ) : (
        <div className="divide-y divide-ink/10">
          {keys.map((k) => (
            <div key={k.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink/80">{k.label}</p>
                <p className="text-xs text-ink/40 font-mono mt-0.5">
                  {k.key_prefix}••••••••
                  <span className="ml-3 non-mono font-sans">
                    Created {new Date(k.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {k.last_used_at && (
                      <> · Last used {new Date(k.last_used_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                    )}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(k.id)}
                disabled={revoking === k.id}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5  transition-colors disabled:opacity-40"
              >
                {revoking === k.id ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-ink/40 border-t border-ink/10 pt-4">
        Base URL: <code className="bg-ink/[0.06] px-1.5 py-0.5 rounded font-mono">https://api.sidequest.me/content/writings?username={'{username}'}</code>
      </div>
    </div>
  )
}
