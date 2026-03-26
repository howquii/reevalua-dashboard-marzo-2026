import { chromium } from 'playwright'
import type { PageIntelligence } from '@/types/ad'

const PIXEL_PATTERNS = {
  meta_pixel:       ['connect.facebook.net', 'facebook.com/tr', 'fbq('],
  google_analytics: ['google-analytics.com', 'googletagmanager.com/gtag', 'gtag('],
  google_tag_manager: ['googletagmanager.com/gtm.js', 'GTM-'],
  tiktok_pixel:     ['analytics.tiktok.com', 'ttq.', 'tiktok-pixel'],
  linkedin_insight: ['snap.licdn.com', 'linkedin.com/insight'],
  klaviyo:          ['klaviyo.com', '_learnq'],
  hotjar:           ['hotjar.com', 'hjid'],
}

const TECH_STACK_PATTERNS = {
  shopify:       ['cdn.shopify.com', 'shopify.com/s/', 'Shopify.shop'],
  clickfunnels:  ['cfcdn.com', 'clickfunnels.com', '__cf_bm'],
  wordpress:     ['/wp-content/', '/wp-includes/', 'wp-json'],
  webflow:       ['webflow.com', 'assets-global.website'],
  wix:           ['wix.com', 'wixstatic.com'],
  kajabi:        ['kajabi.com/assets', 'kajabi-cdn'],
}

export async function detectPageIntelligence(url: string): Promise<PageIntelligence> {
  const defaultResult: PageIntelligence = {
    pixels: {
      meta_pixel: false,
      google_analytics: false,
      google_tag_manager: false,
      tiktok_pixel: false,
      linkedin_insight: false,
      klaviyo: false,
      hotjar: false,
    },
    tech_stack: {
      shopify: false,
      clickfunnels: false,
      wordpress: false,
      webflow: false,
      wix: false,
      kajabi: false,
    },
    has_checkout: false,
  }

  if (!url || !url.startsWith('http')) return defaultResult

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })

  const collectedScripts: string[] = []

  const page = await context.newPage()

  page.on('request', (req) => {
    const reqUrl = req.url()
    collectedScripts.push(reqUrl)
  })

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(2000)

    // Collect inline scripts too
    const inlineScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'))
      return scripts.map(s => s.src || s.textContent || '').join(' ')
    })
    collectedScripts.push(inlineScripts)

    const allContent = collectedScripts.join(' ')

    // Detect pixels
    const pixels = { ...defaultResult.pixels }
    for (const [pixel, patterns] of Object.entries(PIXEL_PATTERNS)) {
      pixels[pixel as keyof typeof pixels] = patterns.some(p => allContent.includes(p))
    }

    // Detect tech stack
    const tech_stack = { ...defaultResult.tech_stack }
    for (const [tech, patterns] of Object.entries(TECH_STACK_PATTERNS)) {
      tech_stack[tech as keyof typeof tech_stack] = patterns.some(p => allContent.includes(p))
    }

    // Check for Shopify checkout specifically
    const hasCheckout = await page.evaluate(() => {
      return !!(
        (window as unknown as Record<string, unknown>)['Shopify'] ||
        document.querySelector('[action*="checkout"]') ||
        document.querySelector('[data-shopify]')
      )
    })

    return { pixels, tech_stack, has_checkout: hasCheckout }
  } catch {
    return defaultResult
  } finally {
    await browser.close()
  }
}
