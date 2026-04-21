import { groceryIdentContent } from '../grocery-ident-i18n'

export default function GroceryIdent({ lang: _lang }: { lang: 'en' | 'es' }) {
  const t = groceryIdentContent['en']

  return (
    <article className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <header className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{t.header.h1}</h1>
          <p className="text-lg text-muted-foreground">{t.header.subtitle}</p>
        </header>

        {/* Overview */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">{t.sections.overview.title}</h2>
          <div className="space-y-4 text-muted-foreground">
            {t.sections.overview.content.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>

        {/* Requirements */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">{t.sections.requirements.title}</h2>
          <ul className="space-y-3 text-muted-foreground">
            {t.sections.requirements.items.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-primary mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Architecture */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">{t.sections.architecture.title}</h2>
          <ul className="space-y-3 text-muted-foreground">
            {t.sections.architecture.content.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-primary mt-1">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Challenges */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">{t.sections.challenges.title}</h2>
          <div className="space-y-4">
            {t.sections.challenges.items.map((item, i) => (
              <div key={i} className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-semibold mb-2">{item.challenge}</h3>
                <p className="text-sm text-muted-foreground">{item.solution}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technologies */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">{t.sections.technologies.title}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {t.sections.technologies.categories.map((cat, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-3">{cat.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((tech, j) => (
                    <span key={j} className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Impact */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">{t.sections.impact.title}</h2>
          <ul className="space-y-3 text-muted-foreground">
            {t.sections.impact.content.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-primary mt-1">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Learnings */}
        <section className="mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">{t.sections.learnings.title}</h2>
          <ul className="space-y-3 text-muted-foreground">
            {t.sections.learnings.content.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-primary mt-1">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="font-display text-2xl font-bold mb-6">{t.faq.title}</h2>
          <div className="space-y-6">
            {t.faq.items.map((item, i) => (
              <div key={i} className="pb-6 border-b border-border last:border-b-0">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  )
}
