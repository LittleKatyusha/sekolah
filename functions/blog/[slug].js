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
  const { request, params, env, next } = context
  const rawSlug = params?.slug

  if (!rawSlug || typeof rawSlug !== 'string') {
    return next()
  }

  // Pass static assets straight through
  if (rawSlug.includes('.')) {
    return next()
  }

  const slug = rawSlug.replace(/\/$/, '')
  const url = new URL(request.url)

  // Resolve tenant from query param or hostname
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

  // API endpoints to try (tenant-specific API first, then global gateway)
  const apiUrls = []
  if (hostTenant) {
    apiUrls.push(`https://${hostTenant}-api.akademihub.id/api/v1`)
  }
  if (env?.VITE_API_URL) {
    apiUrls.push(env.VITE_API_URL)
  }
  apiUrls.push('https://app-api.akademihub.id/api/v1')

  let article = null

  for (const apiUrl of apiUrls) {
    try {
      const endpoint = `${apiUrl}/public/blog/${encodeURIComponent(slug)}?sekolah=${encodeURIComponent(tenant)}`
      const apiRes = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AkademiHub-Edge/1.0',
        },
      })

      if (apiRes.ok) {
        const json = await apiRes.json()
        if (json?.data?.judul) {
          article = json.data
          break
        }
      }
    } catch {
      // Continue to next API candidate
    }
  }

  if (!article || !article.judul) {
    return next()
  }

  try {
    // Fetch base HTML template (SPA root)
    let baseRes
    if (env?.ASSETS) {
      baseRes = await env.ASSETS.fetch(new Request(new URL('/', request.url)))
    } else {
      baseRes = await next()
    }

    let html = await baseRes.text()

    const schoolLabel = hostTenant ? hostTenant.toUpperCase() : 'AkademiHub'
    const title = `${escapeAttr(article.judul)} — ${schoolLabel}`
    const desc = escapeAttr(article.ringkasan || 'Kabar dan artikel pendidikan sekolah.')
    const image = article.thumbnail_url || 'https://akademihub.id/logo-akademihub-horizontal.png'
    const canonical = `${url.origin}/blog/${encodeURIComponent(slug)}`
    const publishedAt = article.published_at || new Date().toISOString()
    const authorName = escapeAttr(article.author_name || 'Tim Redaksi')
    const imageType = image.endsWith('.png') ? 'image/png' : image.endsWith('.webp') ? 'image/webp' : 'image/jpeg'

    // Replace title and description
    html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
    html = html.replace(/<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i, `<meta name="description" content="${desc}" />`)

    // Strip existing canonical, OG/Twitter tags and previous JSON-LD to prevent duplicates
    html = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>\s*/gi, '')
    html = html.replace(/<meta\s+[^>]*(?:property|name)=["'](?:og|twitter):[^"']*["'][^>]*>\s*/gi, '')
    html = html.replace(/<meta\s+[^>]*property=["']article:[^"']*["'][^>]*>\s*/gi, '')
    html = html.replace(/<script[^>]*id=["']article-jsonld["'][^>]*>[\s\S]*?<\/script>\s*/gi, '')

    const metaTags = `
    <link rel="canonical" href="${canonical}" />
    <!-- Open Graph / WhatsApp / Facebook -->
    <meta property="og:site_name" content="${schoolLabel}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:type" content="${imageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="id_ID" />
    <meta property="article:published_time" content="${publishedAt}" />
    <meta property="article:author" content="${authorName}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonical}" />
    <meta property="twitter:url" content="${canonical}" />
    <meta name="twitter:title" content="${title}" />
    <meta property="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta property="twitter:description" content="${desc}" />
    <meta name="twitter:image" content="${image}" />
    <meta property="twitter:image" content="${image}" />
`

    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.judul,
      description: article.ringkasan || '',
      image,
      datePublished: article.published_at,
      dateModified: article.updated_at || article.published_at,
      author: {
        '@type': 'Person',
        name: article.author_name || 'Tim Redaksi',
      },
      publisher: {
        '@type': 'Organization',
        name: schoolLabel,
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonical,
      },
    })

    html = html.replace('</head>', `${metaTags}    <script type="application/ld+json" id="article-jsonld">${jsonLd}</script>\n  </head>`)

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