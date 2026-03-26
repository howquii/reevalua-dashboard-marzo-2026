'use client'

import { useState } from 'react'
import { X, ExternalLink, Download, Bookmark, BookmarkCheck, Play, ChevronDown } from 'lucide-react'
import type { Ad } from '@/types/ad'
import { getScoreColor } from '@/lib/enrichment/performance-scorer'
import { formatSpend } from '@/lib/enrichment/spend-estimator'

interface AdDetailProps {
  ad: Ad | null
  onClose: () => void
  onSave?: (ad: Ad) => void
  isSaved?: boolean
}

const PIXEL_LABELS: Record<string, string> = {
  meta_pixel:         'Meta Pixel',
  google_analytics:   'Google Analytics',
  google_tag_manager: 'Google Tag Manager',
  tiktok_pixel:       'TikTok Pixel',
  linkedin_insight:   'LinkedIn Insight',
  klaviyo:            'Klaviyo',
  hotjar:             'Hotjar',
}

const TECH_LABELS: Record<string, string> = {
  shopify:       'Shopify',
  clickfunnels:  'ClickFunnels',
  wordpress:     'WordPress',
  webflow:       'Webflow',
  wix:           'Wix',
  kajabi:        'Kajabi',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-notion-border">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-notion-muted hover:text-notion-text transition-colors"
      >
        {title}
        <ChevronDown size={12} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export default function AdDetail({ ad, onClose, onSave, isSaved }: AdDetailProps) {
  if (!ad) return null

  const pixels: string[] = Array.isArray(ad.pixels) ? ad.pixels : []
  const tech: string[] = Array.isArray(ad.tech_stack) ? ad.tech_stack : []
  const activePixels = pixels.filter(p => p)
  const activeTech = tech.filter(t => t)

  const spendStr = ad.estimated_spend_mid
    ? formatSpend({
        min: ad.estimated_spend_min ?? 0,
        max: ad.estimated_spend_max ?? 0,
        mid: ad.estimated_spend_mid ?? 0,
        confidence: ad.spend_confidence ?? 'low',
        method: 'duration_proxy',
      })
    : null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white border-l border-notion-border z-50 flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-notion-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-notion-text truncate max-w-[280px]">
              {ad.advertiser_name}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              ad.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {ad.status}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSave?.(ad)}
              className="p-1.5 rounded hover:bg-notion-hover transition-colors text-notion-muted"
              title="Save to collection"
            >
              {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-notion-hover transition-colors text-notion-muted"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Media */}
          <div className="aspect-video bg-gray-50 relative">
            {ad.video_url ? (
              <video
                src={ad.video_url}
                controls
                className="w-full h-full object-contain bg-black"
                poster={ad.image_url ?? undefined}
              />
            ) : ad.image_url ? (
              <img src={ad.image_url} alt={ad.headline ?? ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center px-6">
                  <Play size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-notion-muted">No preview available</p>
                </div>
              </div>
            )}
          </div>

          {/* Metrics strip */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-notion-border bg-notion-sidebar">
            {ad.performance_score != null && (
              <div className="text-center">
                <span className={`text-sm font-bold px-2 py-0.5 rounded ring-1 ${getScoreColor(ad.performance_score)}`}>
                  {ad.performance_score}
                </span>
                <p className="text-xs text-notion-muted mt-0.5">Score</p>
              </div>
            )}
            {ad.days_active != null && (
              <div className="text-center">
                <p className="text-sm font-semibold text-notion-text">{ad.days_active}d</p>
                <p className="text-xs text-notion-muted">Running</p>
              </div>
            )}
            {spendStr && (
              <div className="text-center">
                <p className="text-sm font-semibold text-notion-text">~{spendStr}</p>
                <p className="text-xs text-notion-muted">
                  Est. spend{ad.spend_confidence === 'low' ? ' (proxy)' : ''}
                </p>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-semibold text-notion-text capitalize">{ad.media_type}</p>
              <p className="text-xs text-notion-muted">Format</p>
            </div>
          </div>

          {/* Copy section */}
          <Section title="COPY">
            <div className="space-y-3">
              {ad.headline && (
                <div>
                  <p className="text-xs text-notion-muted mb-0.5">Headline</p>
                  <p className="text-sm text-notion-text font-medium">{ad.headline}</p>
                </div>
              )}
              {ad.primary_text && (
                <div>
                  <p className="text-xs text-notion-muted mb-0.5">Body</p>
                  <p className="text-sm text-notion-text leading-relaxed whitespace-pre-wrap">{ad.primary_text}</p>
                </div>
              )}
              {ad.description && (
                <div>
                  <p className="text-xs text-notion-muted mb-0.5">Description</p>
                  <p className="text-sm text-notion-text">{ad.description}</p>
                </div>
              )}
              {ad.cta_type && (
                <div>
                  <p className="text-xs text-notion-muted mb-0.5">CTA</p>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded text-notion-text">
                    {ad.cta_type.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>
          </Section>

          {/* Intelligence */}
          {(activePixels.length > 0 || activeTech.length > 0) && (
            <Section title="INTELLIGENCE">
              <div className="space-y-3">
                {activePixels.length > 0 && (
                  <div>
                    <p className="text-xs text-notion-muted mb-1.5">Tracking pixels detected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activePixels.map(p => (
                        <span key={p} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                          {PIXEL_LABELS[p] ?? p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {activeTech.length > 0 && (
                  <div>
                    <p className="text-xs text-notion-muted mb-1.5">Tech stack</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTech.map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 bg-gray-100 text-notion-text rounded">
                          {TECH_LABELS[t] ?? t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Transcription */}
          {ad.video_transcription && (
            <Section title="TRANSCRIPTION">
              <p className="text-sm text-notion-text leading-relaxed">{ad.video_transcription}</p>
            </Section>
          )}

          {/* Dates */}
          <Section title="DETAILS">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-notion-muted">Platform</p>
                <p className="text-sm text-notion-text capitalize">{ad.platform}</p>
              </div>
              <div>
                <p className="text-xs text-notion-muted">Ad ID</p>
                <p className="text-xs text-notion-text font-mono truncate">{ad.id}</p>
              </div>
              {ad.start_date && (
                <div>
                  <p className="text-xs text-notion-muted">Started</p>
                  <p className="text-sm text-notion-text">
                    {new Date(ad.start_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {ad.end_date && (
                <div>
                  <p className="text-xs text-notion-muted">Ended</p>
                  <p className="text-sm text-notion-text">
                    {new Date(ad.end_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 border-t border-notion-border flex items-center gap-2 shrink-0">
          {ad.link_url && (
            <a
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-notion-border text-sm text-notion-text hover:bg-notion-hover transition-colors"
            >
              <ExternalLink size={13} />
              Open URL
            </a>
          )}
          {(ad.image_url || ad.video_url) && (
            <a
              href={ad.video_url ?? ad.image_url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-notion-border text-sm text-notion-text hover:bg-notion-hover transition-colors"
            >
              <Download size={13} />
              Download
            </a>
          )}
          <button
            onClick={() => onSave?.(ad)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded bg-notion-text text-white text-sm hover:bg-gray-800 transition-colors"
          >
            {isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </>
  )
}
