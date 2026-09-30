import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// useHomeSeo — lightweight, only updates existing tags from index.html
// ---------------------------------------------------------------------------

export function useHomeSeo({ lang, title, description }: { lang: string; title: string; description: string }) {
  useEffect(() => {
    document.title = title

    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', description)

    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', lang === 'en' ? 'en_US' : 'es_ES')

    document.documentElement.lang = lang
  }, [lang, title, description])
}
