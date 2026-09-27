function escapeAttr(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export async function onRequestGet(context) {
  const { request, env, next } = context
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

  const tenant = (tenantParam || hostTenant || env?.VITE_BLOG_TENANT || '').toLowerCase()
  if (!tenant || tenant === 'akademihub') {
    return next()
  }

  try {
    let baseRes
    if (env?.ASSETS) {
      baseRes = await env.ASSETS.fetch(new Request(new URL('/', request.url)))
    } else {
      baseRes = await next()
    }

    let html = await baseRes.text()

    const schoolLabel = hostTenant ? hostTenant.toUpperCase() : tenant.toUpperCase()
    const title = `Kabar & Artikel · ${escapeAttr(schoolLabel)} | AkademiHub`
    const desc = escapeAttr(`Publikasi prestasi, liputan kegiatan, dan kabar terkini dari civitas akademika ${schoolLabel}.`)
    const canonical = `${url.origin}/blog`
    const image = 'https://akademihub.id/logo-akademihub-horizontal.png'

    html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
    html = html.replace(/<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i, `<meta name="description" content="${desc}" />`)
    html = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>\s*/gi, '')
    html = html.replace(/<meta\s+[^>]*(?:property|name)=["'](?:og|twitter):[^"']*["'][^>]*>\s*/gi, '')

    const metaTags = `
    <link rel="canonical" href="${canonical}" />
    <!-- Open Graph -->
    <meta property="og:site_name" content="${escapeAttr(schoolLabel)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${image}" />
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${image}" />
`
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description: desc,
      url: canonical,
      publisher: {
        '@type': 'Organization',
        name: schoolLabel,
      },
    })

    html = html.replace('</head>', `${metaTags}    <script type="application/ld+json" id="blog-collection-jsonld">${jsonLd}</script>\n  </head>`)

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400',
      },
    })
  } catch {
    return next()
  }
}
