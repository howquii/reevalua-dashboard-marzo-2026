'use client'

import { useState, useEffect, useCallback } from 'react'
import { Flame, Loader2, RefreshCw } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import AdCard from '@/components/ads/AdCard'
import AdDetail from '@/components/ads/AdDetail'
import SaveModal from '@/components/collections/SaveModal'
import type { Ad } from '@/types/ad'

const COUNTRIES = [
  { value: 'ALL', label: 'All Countries' },
  { value: 'PE',  label: '🇵🇪 Peru' },
  { value: 'MX',  label: '🇲🇽 Mexico' },
  { value: 'CO',  label: '🇨🇴 Colombia' },
  { value: 'AR',  label: '🇦🇷 Argentina' },
  { value: 'CL',  label: '🇨🇱 Chile' },
  { value: 'US',  label: '🇺🇸 United States' },
  { value: 'ES',  label: '🇪🇸 Spain' },
  { value: 'BR',  label: '🇧🇷 Brazil' },
]

const INDUSTRIES = [
  { value: 'all',        label: 'All Industries' },
  { value: 'ecommerce',  label: '🛍️ E-commerce' },
  { value: 'travel',     label: '✈️ Travel' },
  { value: 'saas',       label: '💻 SaaS' },
  { value: 'education',  label: '📚 Education' },
  { value: 'fintech',    label: '💳 Fintech' },
  { value: 'fitness',    label: '💪 Fitness' },
]

const SCORES = [
  { value: '0',   label: 'All Scores' },
  { value: '40',  label: 'Warm+ (40+)' },
  { value: '66',  label: 'Hot+ (66+)' },
  { value: '86',  label: 'Fire only (86+)' },
]

const MEDIA_TYPES = [
  { value: 'all',      label: 'All Media' },
  { value: 'video',    label: 'Video' },
  { value: 'image',    label: 'Image' },
  { value: 'carousel', label: 'Carousel' },
]

const SORT_OPTIONS = [
  { value: 'score',   label: 'Top Score' },
  { value: 'spend',   label: 'Est. Spend' },
  { value: 'longest', label: 'Longest Running' },
  { value: 'newest',  label: 'Recently Scraped' },
]

export default function HomePage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const [country, setCountry]     = useState('ALL')
  const [industry, setIndustry]   = useState('all')
  const [minScore, setMinScore]   = useState('0')
  const [mediaType, setMediaType] = useState('all')
  const [sortBy, setSortBy]       = useState('score')

  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [saveTarget, setSaveTarget]  = useState<Ad | null>(null)
  const [savedIds, setSavedIds]      = useState<Set<string>>(new Set())

  const fetchAds = useCallback(async (pageNum = 0) => {
    setLoading(true)
    const params = new URLSearchParams({
      country,
      industry,
      min_score: minScore,
      media_type: mediaType,
      sort: sortBy,
      page: String(pageNum),
    })
    const res = await fetch(`/api/top-ads?${params}`)
    const data = await res.json()
    if (pageNum === 0) {
      setAds(data.ads ?? [])
    } else {
      setAds(prev => [...prev, ...(data.ads ?? [])])
    }
    setTotal(data.total ?? (data.ads?.length ?? 0))
    setHasMore((data.ads?.length ?? 0) === 60)
    setLoading(false)
  }, [country, industry, minScore, mediaType, sortBy])

  useEffect(() => {
    setCurrentPage(0)
    fetchAds(0)
  }, [country, industry, minScore, mediaType, sortBy])

  const handleSeed = async () => {
    setSeeding(true)
    await fetch('/api/seed', { method: 'POST' })
    setSeeding(false)
    fetchAds(0)
  }

  const loadMore = () => {
    const next = currentPage + 1
    setCurrentPage(next)
    fetchAds(next)
  }

  const selectBox = (
    value: string,
    onChange: (v: string) => void,
    options: { value: string; label: string }[]
  ) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-8 px-2 text-xs border border-notion-border rounded bg-white text-notion-text focus:outline-none focus:border-gray-400 cursor-pointer"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-notion-bg">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-notion-border bg-white shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Flame size={15} className="text-orange-500" />
            <h1 className="text-sm font-semibold text-notion-text">Top Performing Ads</h1>
            {!loading && total > 0 && (
              <span className="text-xs text-notion-muted">{total.toLocaleString()} ads</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {selectBox(country,   setCountry,   COUNTRIES)}
            {selectBox(industry,  setIndustry,  INDUSTRIES)}
            {selectBox(minScore,  setMinScore,  SCORES)}
            {selectBox(mediaType, setMediaType, MEDIA_TYPES)}
            {selectBox(sortBy,    setSortBy,    SORT_OPTIONS)}
            <button
              onClick={() => fetchAds(0)}
              title="Refresh"
              className="h-8 w-8 flex items-center justify-center border border-notion-border rounded bg-white text-notion-muted hover:text-notion-text hover:border-gray-400 transition-colors"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && ads.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={20} className="animate-spin text-notion-muted" />
            </div>
          ) : ads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <p className="text-3xl">📭</p>
              <p className="text-sm text-notion-muted">No ads in the database yet.</p>
              <p className="text-xs text-notion-muted max-w-xs">
                Use <strong>Search Ads</strong> to scrape ads by keyword, or seed sample data to see how it looks.
              </p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 bg-notion-text text-white rounded text-sm hover:bg-gray-800 transition-colors disabled:opacity-60"
              >
                {seeding
                  ? <><Loader2 size={13} className="animate-spin" /> Seeding... (takes ~2 min)</>
                  : <><Flame size={13} /> Seed top performers</>
                }
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {ads.map(ad => (
                  <AdCard
                    key={ad.id}
                    ad={ad}
                    isSaved={savedIds.has(ad.id)}
                    onSave={a => setSaveTarget(a)}
                    onClick={a => setSelectedAd(a)}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-6 pb-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-5 py-2 text-xs border border-notion-border rounded text-notion-muted hover:text-notion-text hover:border-gray-400 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedAd && (
        <AdDetail
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
          onSave={a => { setSelectedAd(null); setSaveTarget(a) }}
          isSaved={savedIds.has(selectedAd.id)}
        />
      )}

      {saveTarget && (
        <SaveModal
          ad={saveTarget}
          onClose={() => setSaveTarget(null)}
          onSaved={id => setSavedIds(prev => new Set([...prev, id]))}
        />
      )}
    </div>
  )
}
