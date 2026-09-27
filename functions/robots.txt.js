export async function onRequestGet({ request }) {
  const url = new URL(request.url)
  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /reset-password

Sitemap: ${url.protocol}//${url.host}/sitemap.xml
`
  return new Response(robots, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  })
}
