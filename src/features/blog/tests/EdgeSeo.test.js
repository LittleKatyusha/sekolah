import { describe, it, expect, vi } from 'vitest'
import { onRequestGet as sitemapHandler } from '../../../../functions/sitemap.xml'
import { onRequestGet as robotsHandler } from '../../../../functions/robots.txt'
import { onRequestGet as blogIndexHandler } from '../../../../functions/blog/index'

describe('Edge SEO Functions', () => {
  it('robots.txt returns correct disallow directives and tenant sitemap URL', async () => {
    const request = new Request('https://smada.akademihub.id/robots.txt')
    const res = await robotsHandler({ request })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain')
    const text = await res.text()
    expect(text).toContain('Disallow: /admin/')
    expect(text).toContain('Sitemap: https://smada.akademihub.id/sitemap.xml')
  })

  it('sitemap.xml generates valid XML with tenant routes and articles', async () => {
    const mockArticles = [
      { slug: 'berita-satu', updated_at: '2026-09-20T10:00:00Z' },
      { slug: 'berita-dua', published_at: '2026-09-22T08:00:00Z' },
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockArticles }),
    })

    const request = new Request('https://smada.akademihub.id/sitemap.xml')
    const res = await sitemapHandler({ request, env: {} })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/xml')
    const xml = await res.text()

    expect(xml).toContain('<loc>https://smada.akademihub.id/</loc>')
    expect(xml).toContain('<loc>https://smada.akademihub.id/blog</loc>')
    expect(xml).toContain('<loc>https://smada.akademihub.id/ppdb/portal</loc>')
    expect(xml).toContain('<loc>https://smada.akademihub.id/blog/berita-satu</loc>')
    expect(xml).toContain('<loc>https://smada.akademihub.id/blog/berita-dua</loc>')
    expect(xml).toContain('<lastmod>2026-09-20</lastmod>')
    expect(xml).toContain('<lastmod>2026-09-22</lastmod>')
  })

  it('blog/index injects tenant metadata and canonical link into base html', async () => {
    const baseHtml = '<!doctype html><html><head><title>AkademiHub</title><meta name="description" content="Default" /></head><body><div id="root"></div></body></html>'
    const request = new Request('https://smada.akademihub.id/blog')

    const next = vi.fn().mockResolvedValue({
      text: async () => baseHtml,
    })

    const res = await blogIndexHandler({ request, env: {}, next })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    const html = await res.text()

    expect(html).toContain('<title>Kabar & Artikel · SMADA | AkademiHub</title>')
    expect(html).toContain('<link rel="canonical" href="https://smada.akademihub.id/blog" />')
    expect(html).toContain('content="https://smada.akademihub.id/blog"')
    expect(html).toContain('CollectionPage')
  })
})
