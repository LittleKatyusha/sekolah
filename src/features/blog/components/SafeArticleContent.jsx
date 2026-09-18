import React, { useMemo } from 'react'
import DOMPurify from 'dompurify'

export const SafeArticleContent = ({ content, className = '' }) => {
  const sanitizedHtml = useMemo(() => {
    if (!content) return ''
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'u', 's', 'strike',
        'blockquote', 'code', 'pre',
        'ul', 'ol', 'li',
        'a', 'img', 'br', 'hr', 'span',
        'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class'],
    })
  }, [content])

  return (
    <div
      className={`prose max-w-none break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

export default SafeArticleContent
