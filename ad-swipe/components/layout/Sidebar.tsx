'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, BookmarkCheck, TrendingUp, Settings, ChevronDown, Plus, Layers, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Collection } from '@/types/ad'

export default function Sidebar() {
  const pathname = usePathname()
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionsOpen, setCollectionsOpen] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('collections')
        .select('*, saved_ads(count)')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .then(({ data: cols }) => {
          if (cols) setCollections(cols as Collection[])
        })
    })
  }, [])

  const navItem = (href: string, icon: React.ReactNode, label: string) => {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors ${
          active
            ? 'bg-notion-hover text-notion-text font-medium'
            : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'
        }`}
      >
        <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>
        {label}
      </Link>
    )
  }

  return (
    <aside className="w-60 h-full flex flex-col bg-notion-sidebar border-r border-notion-border overflow-y-auto shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-notion-border">
        <div className="w-6 h-6 bg-notion-text rounded flex items-center justify-center shrink-0">
          <Layers size={13} className="text-white" />
        </div>
        <span className="font-semibold text-notion-text text-sm">Ad Swipe</span>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-2 py-2">
        {navItem('/', <Flame size={14} />, 'Top Performers')}
        {navItem('/search', <Search size={14} />, 'Search Ads')}
        {navItem('/collections', <BookmarkCheck size={14} />, 'Collections')}
        {navItem('/monitors', <TrendingUp size={14} />, 'Brand Monitors')}
      </nav>

      {/* Divider */}
      <div className="border-t border-notion-border mx-2 my-1" />

      {/* Collections section */}
      <div className="px-2 py-1">
        <button
          onClick={() => setCollectionsOpen(v => !v)}
          className="w-full flex items-center justify-between px-2 py-1 rounded text-xs text-notion-muted hover:bg-notion-hover hover:text-notion-text transition-colors"
        >
          <span className="font-medium uppercase tracking-wide">Collections</span>
          <ChevronDown
            size={12}
            className={`transition-transform ${collectionsOpen ? '' : '-rotate-90'}`}
          />
        </button>

        {collectionsOpen && (
          <div className="mt-0.5 flex flex-col gap-0.5">
            {collections.map(col => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className={`flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors truncate ${
                  pathname === `/collections/${col.id}`
                    ? 'bg-notion-hover text-notion-text'
                    : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: col.color || '#787774' }}
                />
                <span className="truncate">{col.name}</span>
              </Link>
            ))}

            <Link
              href="/collections/new"
              className="flex items-center gap-2 px-2 py-1 rounded text-sm text-notion-muted hover:bg-notion-hover hover:text-notion-text transition-colors"
            >
              <Plus size={13} className="shrink-0" />
              New collection
            </Link>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="mt-auto border-t border-notion-border">
        <div className="px-2 py-2">
          {navItem('/settings', <Settings size={14} />, 'Settings')}
        </div>
      </div>
    </aside>
  )
}
