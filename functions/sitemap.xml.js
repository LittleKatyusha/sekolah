export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)

  const tenantParam =
    url.searchParams.get('sekolah') ||
    url.searchParams.get('tenant') ||
    url.searchParams.get('subdomain') ||
    url.searchParams.get('identifier')

  const hostnameParts = url.hostname.toLowerCase().split('.')
  let hostTenant = null
  if (hostnameParts.length > 2 && !['app', 'www', 'localhost'].includes(hostnameParts[0])) {
    hostTenant = hostnameParts[0]
  }

  const tenant = (tenantParam || hostTenant || env?.VITE_BLOG_TENANT || 'akademihub').toLowerCase()

  const apiUrls = []
  if (hostTenant) {
    apiUrls.push(`https://${hostTenant}-api.akademihub.id/api/v1`)
  }
  if (env?.VITE_API_URL) {
    apiUrls.push(env.VITE_API_URL)
  }
  apiUrls.push('https://app-api.akademihub.id/api/v1')

  let articles = []
  for (const apiUrl of apiUrls) {
    try {
      const endpoint = `${apiUrl}/public/blog?sekolah=${encodeURIComponent(tenant)}&limit=500`
      const res = await fetch(endpoint, {
        headers: { Accept: 'application/json', 'User-Agent': 'AkademiHub-Sitemap/1.0' },
      })
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json?.data)) {
          articles = json.data
          break
        }
      }
    } catch {}
  }

  const baseUrl = `${url.protocol}//${url.host}`
  const now = new Date().toISOString().split('T')[0]

  const staticUrls = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily', lastmod: now },
    { loc: `${baseUrl}/blog`, priority: '0.9', changefreq: 'daily', lastmod: now },
    { loc: `${baseUrl}/ppdb/portal`, priority: '0.8', changefreq: 'weekly', lastmod: now },
  ]

  const articleUrls = articles.map((art) => {
    const rawDate = art.updated_at || art.published_at || now
    const lastmod = rawDate.split('T')[0]
    return {
      loc: `${baseUrl}/blog/${encodeURIComponent(art.slug)}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod,
    }
  })

  const allUrls = [...staticUrls, ...articleUrls]
  const xmlEntries = allUrls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join('\n')

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlEntries}\n</urlset>\n`

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
