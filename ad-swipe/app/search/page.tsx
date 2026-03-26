'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, SlidersHorizontal, Loader2, X } from 'lucide-react'
import AdCard from '@/components/ads/AdCard'
import AdDetail from '@/components/ads/AdDetail'
import SaveModal from '@/components/collections/SaveModal'
import Sidebar from '@/components/layout/Sidebar'
import type { Ad, SearchFilters } from '@/types/ad'

const COUNTRIES = [
  { value: 'ALL', label: 'All Countries' },
  // North America
  { value: 'US',  label: 'United States' },
  { value: 'CA',  label: 'Canada' },
  { value: 'MX',  label: 'Mexico' },
  // Central America & Caribbean
  { value: 'GT',  label: 'Guatemala' },
  { value: 'HN',  label: 'Honduras' },
  { value: 'SV',  label: 'El Salvador' },
  { value: 'NI',  label: 'Nicaragua' },
  { value: 'CR',  label: 'Costa Rica' },
  { value: 'PA',  label: 'Panama' },
  { value: 'DO',  label: 'Dominican Republic' },
  { value: 'CU',  label: 'Cuba' },
  { value: 'PR',  label: 'Puerto Rico' },
  // South America
  { value: 'CO',  label: 'Colombia' },
  { value: 'VE',  label: 'Venezuela' },
  { value: 'EC',  label: 'Ecuador' },
  { value: 'PE',  label: 'Peru' },
  { value: 'BO',  label: 'Bolivia' },
  { value: 'BR',  label: 'Brazil' },
  { value: 'PY',  label: 'Paraguay' },
  { value: 'UY',  label: 'Uruguay' },
  { value: 'AR',  label: 'Argentina' },
  { value: 'CL',  label: 'Chile' },
  // Europe (Spanish/Portuguese)
  { value: 'ES',  label: 'Spain' },
  { value: 'PT',  label: 'Portugal' },
  { value: 'GB',  label: 'United Kingdom' },
]

const SORT_OPTIONS = [
  { value: 'score',   label: 'Hottest Score' },
  { value: 'newest',  label: 'Newest' },
  { value: 'longest', label: 'Longest Running' },
  { value: 'spend',   label: 'Estimated Spend' },
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [adsFound, setAdsFound] = useState(0)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [saveAd, setSaveAd] = useState<Ad | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Partial<SearchFilters>>({
    country: 'ALL',
    media_type: 'all',
    active_only: false,
    sort_by: 'score',
  })
  const searchRef = useRef<HTMLInputElement>(null)
  const jobPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setAds([])
    setAdsFound(0)
    if (jobPollRef.current) clearInterval(jobPollRef.current)

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, ...filters }),
      })
      const data = await res.json()
      setAds(data.ads ?? [])
      setAdsFound(data.ads?.length ?? 0)

      if (data.jobId) {
        setJobId(data.jobId)
        // Poll for live updates
        jobPollRef.current = setInterval(async () => {
          const statusRes = await fetch(`/api/scrape/${data.jobId}`)
          const status = await statusRes.json()
          setAdsFound(status.ads_found ?? 0)
          if (status.status === 'done' || status.status === 'failed') {
            if (jobPollRef.current) clearInterval(jobPollRef.current)
            setJobId(null)
            // Reload results
            const refresh = await fetch('/api/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: q, ...filters }),
            })
            const refreshData = await refresh.json()
            setAds(refreshData.ads ?? [])
            setLoading(false)
          }
        }, 2000)
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    return () => { if (jobPollRef.current) clearInterval(jobPollRef.current) }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 border-b border-notion-border px-6 py-3">
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="flex-1 flex items-center gap-2 border border-notion-border rounded-lg px-3 py-2 bg-white focus-within:border-gray-400 transition-colors">
              <Search size={14} className="text-notion-muted shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
                placeholder="Search brands or keywords... e.g. dropshipping, peso pluma"
                className="flex-1 outline-none text-notion-text placeholder:text-notion-muted bg-transparent text-sm"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-notion-muted hover:text-notion-text">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Country */}
            <select
              value={filters.country}
              onChange={e => setFilters(f => ({ ...f, country: e.target.value }))}
              className="border border-notion-border rounded-lg px-3 py-2 text-sm text-notion-text bg-white outline-none cursor-pointer hover:border-gray-400 transition-colors"
            >
              {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 border rounded-lg px-3 py-2 text-sm transition-colors ${
                showFilters ? 'border-notion-text bg-notion-hover text-notion-text' : 'border-notion-border text-notion-muted hover:border-gray-400 hover:text-notion-text'
              }`}
            >
              <SlidersHorizontal size={13} />
              Filters
            </button>

            {/* Search button */}
            <button
              onClick={() => handleSearch(query)}
              disabled={loading || !query.trim()}
              className="flex items-center gap-1.5 bg-notion-text text-white rounded-lg px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              Search
            </button>
          </div>

          {/* Filters row */}
          {showFilters && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-notion-border">
              <label className="flex items-center gap-2 text-sm text-notion-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.active_only ?? false}
                  onChange={e => setFilters(f => ({ ...f, active_only: e.target.checked }))}
                  className="rounded"
                />
                Active only
              </label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-notion-muted">Media:</span>
                {(['all', 'image', 'video'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setFilters(f => ({ ...f, media_type: m }))}
                    className={`text-sm px-2 py-0.5 rounded transition-colors capitalize ${
                      filters.media_type === m
                        ? 'bg-notion-text text-white'
                        : 'text-notion-muted hover:text-notion-text'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-notion-muted">Sort:</span>
                <select
                  value={filters.sort_by}
                  onChange={e => setFilters(f => ({ ...f, sort_by: e.target.value as SearchFilters['sort_by'] }))}
                  className="border border-notion-border rounded px-2 py-1 text-sm text-notion-text bg-white outline-none"
                >
                  {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto">
          {/* Status bar */}
          {(loading || ads.length > 0) && (
            <div className="px-6 py-2 border-b border-notion-border flex items-center gap-2">
              {loading && (
                <>
                  <Loader2 size={12} className="animate-spin text-notion-muted" />
                  <span className="text-xs text-notion-muted">
                    {jobId ? `Scraping… ${adsFound} ads found so far` : 'Searching cached results…'}
                  </span>
                </>
              )}
              {!loading && ads.length > 0 && (
                <span className="text-xs text-notion-muted">{ads.length} ads</span>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && ads.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full pb-20 select-none">
              <div className="w-12 h-12 rounded-full bg-notion-sidebar flex items-center justify-center mb-4">
                <Search size={20} className="text-notion-muted" />
              </div>
              <p className="text-notion-text font-medium mb-1">Search the Meta Ad Library</p>
              <p className="text-sm text-notion-muted text-center max-w-xs">
                Enter a brand name or keyword to find ads with spend estimates, performance scores, and more.
              </p>
            </div>
          )}

          {/* Grid */}
          {ads.length > 0 && (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ads.map(ad => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  onClick={setSelectedAd}
                  onSave={setSaveAd}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Ad detail drawer */}
      {selectedAd && (
        <AdDetail
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
          onSave={ad => { setSelectedAd(null); setSaveAd(ad) }}
        />
      )}

      {/* Save modal */}
      {saveAd && (
        <SaveModal ad={saveAd} onClose={() => setSaveAd(null)} />
      )}
    </div>
  )
}
