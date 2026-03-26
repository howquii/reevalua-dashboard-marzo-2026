'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, BookmarkCheck, Download } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/client'
import type { Collection } from '@/types/ad'

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadCollections()
  }, [])

  async function loadCollections() {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return setLoading(false)

    const { data } = await supabase
      .from('collections')
      .select('*, saved_ads(count)')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })

    setCollections((data as Collection[]) ?? [])
    setLoading(false)
  }

  async function createCollection() {
    if (!newName.trim()) return
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const { data } = await supabase
      .from('collections')
      .insert({ name: newName.trim(), user_id: user.user.id, color: '#787774' })
      .select()
      .single()

    if (data) {
      setCollections(c => [data as Collection, ...c])
      setNewName('')
      setCreating(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-notion-text">Collections</h1>
              <p className="text-sm text-notion-muted mt-1">Organize your saved ads into swipe files</p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 bg-notion-text text-white rounded-lg px-3 py-2 text-sm hover:bg-gray-800 transition-colors"
            >
              <Plus size={14} />
              New collection
            </button>
          </div>

          {/* Create form */}
          {creating && (
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createCollection()}
                placeholder="Collection name…"
                autoFocus
                className="flex-1 border border-notion-border rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
              <button
                onClick={createCollection}
                className="px-4 py-2 bg-notion-text text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => { setCreating(false); setNewName('') }}
                className="px-4 py-2 border border-notion-border rounded-lg text-sm text-notion-muted hover:bg-notion-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Collections list */}
          {loading ? (
            <div className="py-20 text-center text-notion-muted text-sm">Loading…</div>
          ) : collections.length === 0 ? (
            <div className="py-20 text-center">
              <BookmarkCheck size={32} className="mx-auto text-notion-border mb-3" />
              <p className="text-notion-text font-medium mb-1">No collections yet</p>
              <p className="text-sm text-notion-muted">Save ads from the search page to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map(col => (
                <div
                  key={col.id}
                  className="flex items-center gap-4 p-4 border border-notion-border rounded-lg hover:border-gray-400 transition-colors group"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: col.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/collections/${col.id}`}
                      className="font-medium text-notion-text hover:text-notion-accent transition-colors"
                    >
                      {col.name}
                    </Link>
                    {col.description && (
                      <p className="text-xs text-notion-muted truncate">{col.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-notion-muted shrink-0">
                    {((col as { saved_ads?: Array<{ count: number }> }).saved_ads?.[0] as { count?: number } | undefined)?.count ?? 0} ads
                  </span>
                  <a
                    href={`/api/collections/${col.id}/export?format=csv`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-notion-muted hover:text-notion-text"
                    title="Export CSV"
                  >
                    <Download size={14} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
