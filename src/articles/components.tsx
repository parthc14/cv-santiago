import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// Layout shell
// ---------------------------------------------------------------------------

export function ArticleLayout({ lang, children }: { lang?: 'es' | 'en'; children: React.ReactNode }) {
  useEffect(() => {
    if (lang) document.documentElement.lang = lang
  }, [lang])

  return (
    <div className="min-h-screen bg-background text-foreground bg-[length:24px_24px] [background-image:radial-gradient(circle,hsl(var(--dot-grid))_1px,transparent_1px)]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>
    </div>
  )
}
