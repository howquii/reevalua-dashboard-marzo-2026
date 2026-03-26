'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Ad, Collection } from '@/types/ad'

interface SaveModalProps {
  ad: Ad | null
  onClose: () => void
}

export default function SaveModal({ ad, onClose }: SaveModalProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!ad) return
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: cols } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
      if (cols) setCollections(cols as Collection[])

      const { data: alreadySaved } = await supabase
        .from('saved_ads')
        .select('collection_id')
        .eq('ad_id', ad.id)
      if (alreadySaved) setSaved(new Set(alreadySaved.map((r: { collection_id: string }) => r.collection_id)))
    })
  }, [ad])

  async function toggleSave(collectionId: string) {
    if (!ad) return
    if (saved.has(collectionId)) {
      await supabase.from('saved_ads').delete().eq('ad_id', ad.id).eq('collection_id', collectionId)
      setSaved(s => { const n = new Set(s); n.delete(collectionId); return n })
    } else {
      await supabase.from('saved_ads').upsert({ ad_id: ad.id, collection_id: collectionId })
      setSaved(s => new Set([...s, collectionId]))
    }
  }

  async function createCollection() {
    if (!newName.trim()) return
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return
    const { data: col } = await supabase
      .from('collections')
      .insert({ name: newName.trim(), user_id: user.user.id, color: '#787774' })
      .select()
      .single()
    if (col) {
      setCollections(c => [col as Collection, ...c])
      setNewName('')
      setCreating(false)
      await toggleSave((col as Collection).id)
    }
  }

  if (!ad) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-60 flex items-center justify-center" onClick={onClose}>
        <div
          className="bg-white rounded-lg border border-notion-border shadow-lg w-80 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-notion-border">
            <span className="text-sm font-medium text-notion-text">Save to collection</span>
            <button onClick={onClose} className="text-notion-muted hover:text-notion-text">
              <X size={14} />
            </button>
          </div>

          {/* Collections */}
          <div className="max-h-60 overflow-y-auto py-1">
            {collections.length === 0 && (
              <p className="text-xs text-notion-muted px-4 py-3">No collections yet</p>
            )}
            {collections.map(col => (
              <button
                key={col.id}
                onClick={() => toggleSave(col.id)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-notion-hover transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm text-notion-text">{col.name}</span>
                </div>
                {saved.has(col.id) && <Check size={13} className="text-notion-accent" />}
              </button>
            ))}
          </div>

          {/* Create new */}
          <div className="border-t border-notion-border px-4 py-3">
            {creating ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createCollection()}
                  placeholder="Collection name"
                  autoFocus
                  className="flex-1 border border-notion-border rounded px-2 py-1 text-sm outline-none focus:border-notion-accent"
                />
                <button
                  onClick={createCollection}
                  className="px-2 py-1 bg-notion-text text-white rounded text-sm"
                >
                  Create
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 text-sm text-notion-muted hover:text-notion-text transition-colors"
              >
                <Plus size={13} />
                New collection
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
