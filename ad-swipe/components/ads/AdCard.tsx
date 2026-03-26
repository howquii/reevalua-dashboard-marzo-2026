'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, ExternalLink, Play } from 'lucide-react'
import type { Ad } from '@/types/ad'
import { getScoreColor, getScoreLabel } from '@/lib/enrichment/performance-scorer'
import { formatSpend } from '@/lib/enrichment/spend-estimator'

interface AdCardProps {
  ad: Ad
  onSave?: (ad: Ad) => void
  isSaved?: boolean
  onClick?: (ad: Ad) => void
}

const PIXEL_ICONS: Record<string, string> = {
  meta_pixel:         '📘',
  google_analytics:   '📊',
  google_tag_manager: '🏷️',
  tiktok_pixel:       '🎵',
  linkedin_insight:   '💼',
  klaviyo:            '📧',
}

const TECH_LABELS: Record<string, { label: string; color: string }> = {
  shopify:       { label: 'Shopify',       color: 'bg-green-50 text-green-700' },
  clickfunnels:  { label: 'ClickFunnels', color: 'bg-orange-50 text-orange-700' },
  wordpress:     { label: 'WordPress',    color: 'bg-blue-50 text-blue-700' },
  webflow:       { label: 'Webflow',      color: 'bg-purple-50 text-purple-700' },
  wix:           { label: 'Wix',          color: 'bg-yellow-50 text-yellow-700' },
  kajabi:        { label: 'Kajabi',       color: 'bg-pink-50 text-pink-700' },
}

export default function AdCard({ ad, onSave, isSaved = false, onClick }: AdCardProps) {
  const [hovered, setHovered] = useState(false)

  const spendStr = ad.estimated_spend_mid
    ? formatSpend({
        min: ad.estimated_spend_min ?? 0,
        max: ad.estimated_spend_max ?? 0,
        mid: ad.estimated_spend_mid ?? 0,
        confidence: ad.spend_confidence ?? 'low',
        method: 'duration_proxy',
      })
    : null

  // Daily spend: monthly_mid / 30
  const dailySpend = ad.estimated_spend_mid
    ? Math.round(ad.estimated_spend_mid / 30)
    : null

  const scoreColor = ad.performance_score != null ? getScoreColor(ad.performance_score) : ''
  const scoreLabel = ad.performance_score != null ? getScoreLabel(ad.performance_score) : null
  const SCORE_EMOJI: Record<string, string> = { cold: '❄️', warm: '🌡️', hot: '🔥', fire: '🚀' }
  const pixels: string[] = Array.isArray(ad.pixels) ? ad.pixels : []
  const tech: string[] = Array.isArray(ad.tech_stack) ? ad.tech_stack : []

  const daysLabel = ad.days_active != null
    ? ad.days_active >= 90 ? '90d+'
    : ad.days_active >= 30 ? `${ad.days_active}d`
    : `${ad.days_active}d`
    : null

  const daysColor = ad.days_active != null
    ? ad.days_active >= 30 ? 'text-green-700 bg-green-50'
    : ad.days_active >= 7  ? 'text-yellow-700 bg-yellow-50'
    : 'text-gray-500 bg-gray-50'
    : 'text-gray-500 bg-gray-50'

  return (
    <div
      className="group relative bg-white border border-notion-border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-gray-400 hover:shadow-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick?.(ad)}
    >
      {/* Media thumbnail */}
      <div className="relative aspect-video bg-gray-50 overflow-hidden">
        {ad.image_url || ad.video_url ? (
          <>
            {ad.image_url && (
              <img
                src={ad.image_url}
                alt={ad.headline ?? ad.advertiser_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            {ad.media_type === 'video' && !hovered && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play size={14} className="text-white ml-0.5" fill="white" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center px-4">
              <p className="text-xs text-notion-muted line-clamp-3">
                {ad.primary_text ?? 'No creative preview'}
              </p>
            </div>
          </div>
        )}

        {/* Status pill */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            ad.status === 'ACTIVE'
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {ad.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Save button */}
        <button
          className={`absolute top-2 right-2 p-1.5 rounded transition-all ${
            isSaved
              ? 'bg-white text-notion-text shadow-sm'
              : 'bg-white/0 text-transparent group-hover:bg-white group-hover:text-notion-muted shadow-sm'
          }`}
          onClick={e => { e.stopPropagation(); onSave?.(ad) }}
          title={isSaved ? 'Saved' : 'Save to collection'}
        >
          {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Advertiser */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-notion-text text-sm truncate">
            {ad.advertiser_name}
          </span>
          <span className="text-xs text-notion-muted shrink-0">
            {ad.media_type}
          </span>
        </div>

        {/* Headline */}
        {ad.headline && (
          <p className="text-xs text-notion-muted line-clamp-2">{ad.headline}</p>
        )}

        {/* Score + Daily spend row */}
        <div className="flex items-center justify-between gap-1">
          {ad.performance_score != null && scoreLabel && (
            <span className={`text-xs px-1.5 py-0.5 rounded ring-1 font-semibold flex items-center gap-0.5 ${scoreColor}`}>
              <span>{SCORE_EMOJI[scoreLabel]}</span>
              <span className="uppercase tracking-wide text-[10px]">{scoreLabel}</span>
              <span className="ml-0.5">{ad.performance_score}</span>
            </span>
          )}
          {dailySpend != null && (
            <span className="text-[10px] text-notion-muted font-medium">
              ~${dailySpend}/day
            </span>
          )}
        </div>

        {/* Metadata pills */}
        <div className="flex flex-wrap items-center gap-1">
          {daysLabel && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${daysColor}`}>
              {daysLabel}
            </span>
          )}
          {(ad as Ad & { creatives_count?: number | null }).creatives_count != null && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-50 text-gray-500">
              {(ad as Ad & { creatives_count?: number | null }).creatives_count} creative{(ad as Ad & { creatives_count?: number | null }).creatives_count !== 1 ? 's' : ''}
            </span>
          )}
          {(ad as Ad & { country_code?: string | null }).country_code && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 uppercase">
              {(ad as Ad & { country_code?: string | null }).country_code}
            </span>
          )}
        </div>

        {/* Spend estimate */}
        {spendStr && (
          <p className="text-xs text-notion-muted">
            ~{spendStr}
            {ad.spend_confidence === 'low' && (
              <span className="ml-1 text-gray-300">est.</span>
            )}
          </p>
        )}

        {/* Pixels & Tech stack */}
        {(pixels.length > 0 || tech.length > 0) && (
          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-notion-border">
            {pixels.slice(0, 4).map(p => (
              <span key={p} title={p} className="text-xs">{PIXEL_ICONS[p] ?? '📌'}</span>
            ))}
            {tech.slice(0, 2).map(t => {
              const cfg = TECH_LABELS[t]
              return cfg ? (
                <span key={t} className={`text-xs px-1.5 py-0.5 rounded ${cfg.color}`}>
                  {cfg.label}
                </span>
              ) : null
            })}
          </div>
        )}

        {/* Landing page link */}
        {ad.link_url && (
          <a
            href={ad.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-notion-muted hover:text-notion-accent transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={11} />
            <span className="truncate">
              {(() => { try { return new URL(ad.link_url).hostname } catch { return ad.link_url } })()}
            </span>
          </a>
        )}
      </div>
    </div>
  )
}
