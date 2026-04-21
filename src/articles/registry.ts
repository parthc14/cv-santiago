import type { ComponentType } from 'react'

export interface ArticleSeo {
  title: string
  description: string
}

export interface ArticleSeoMeta {
  datePublished: string
  dateModified: string
  keywords: string[]
  articleType: 'Article' | 'TechArticle'
  articleTags: string
  images: string[]
  about: Array<Record<string, string>>
  extra?: Record<string, string>
  citation?: Array<{ '@type': string; name: string; url: string }>
  isBasedOn?: Record<string, unknown>
  mentions?: Array<Record<string, string | string[] | Record<string, string>>>
  discussionUrl?: string
  relatedLink?: string
  communityUrl?: string
  video?: Record<string, unknown>
  subjectOf?: Record<string, unknown>
}

export interface ArticleConfig {
  id: string
  slugs: { es: string; en: string }
  titles: { es: string; en: string }
  seo: { es: ArticleSeo; en: ArticleSeo }
  sectionLabels: { es: Record<string, string>; en: Record<string, string> }
  type: 'collab' | 'case-study' | 'bridge'
  ogImage?: string
  heroImage?: string
  component: () => Promise<{ default: ComponentType<{ lang: 'es' | 'en' }> }>
  xDefaultSlug?: string
  ragReady?: boolean
  i18nFile?: string
  seoMeta?: ArticleSeoMeta
}

// Parth's portfolio articles
export const articleRegistry: ArticleConfig[] = [
  {
    id: 'hawk',
    slugs: { es: 'hawk', en: 'hawk' },
    titles: { es: 'HAWK', en: 'HAWK' },
    seo: {
      es: {
        title: 'HAWK: Predictive Operations Intelligence Platform',
        description: 'Multi-site operational intelligence system with subprocess-level bottleneck detection and predictive analytics',
      },
      en: {
        title: 'HAWK: Predictive Operations Intelligence Platform',
        description: 'Multi-site operational intelligence system with subprocess-level bottleneck detection and predictive analytics',
      },
    },
    sectionLabels: { es: {}, en: {} },
    type: 'case-study',
    component: () => import('./HAWK').then(m => ({ default: m.default })),
    ragReady: true,
    seoMeta: {
      datePublished: '2023-10-01',
      dateModified: '2024-04-21',
      keywords: ['operations intelligence', 'distributed systems', 'AWS', 'machine learning', 'predictive analytics'],
      articleType: 'TechArticle',
      articleTags: 'operations,aws,systems-design,machine-learning',
      images: [],
      about: [{ name: 'Amazon WW Grocery' }],
    },
  },
  {
    id: 'grocery-identification',
    slugs: { es: 'grocery-identification', en: 'grocery-identification' },
    titles: { es: 'Grocery Identification', en: 'Grocery Identification' },
    seo: {
      es: {
        title: 'Grocery Identification Microservice',
        description: 'Near real-time inventory event processing microservice handling 10K-100K events daily',
      },
      en: {
        title: 'Grocery Identification Microservice',
        description: 'Near real-time inventory event processing microservice handling 10K-100K events daily',
      },
    },
    sectionLabels: { es: {}, en: {} },
    type: 'case-study',
    component: () => import('./GroceryIdent').then(m => ({ default: m.default })),
    ragReady: true,
    seoMeta: {
      datePublished: '2021-07-01',
      dateModified: '2024-04-21',
      keywords: ['microservices', 'event processing', 'AWS', 'inventory management', 'real-time systems'],
      articleType: 'TechArticle',
      articleTags: 'microservices,aws,event-processing,inventory',
      images: [],
      about: [{ name: 'Amazon Physical Stores' }],
    },
  },
]

export function getAltPaths(): Record<string, string> {
  const map: Record<string, string> = {
    '/': '/en',
    '/en': '/',
    '/sobre-mi': '/about',
    '/about': '/sobre-mi',
    '/privacidad': '/privacy',
    '/privacy': '/privacidad',
  }
  for (const article of articleRegistry) {
    map[`/${article.slugs.es}`] = `/${article.slugs.en}`
    map[`/${article.slugs.en}`] = `/${article.slugs.es}`
  }
  return map
}

export function getPageTitles(): Record<string, string> {
  const map: Record<string, string> = {
    '/': "Parth's Portfolio",
    '/en': "Parth's Portfolio",
    '/sobre-mi': 'Sobre Mí',
    '/about': 'About',
  }
  for (const article of articleRegistry) {
    map[`/${article.slugs.es}`] = article.titles.es
    map[`/${article.slugs.en}`] = article.titles.en
  }
  return map
}

export function getSectionLabels(): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {}
  for (const article of articleRegistry) {
    map[`/${article.slugs.es}`] = article.sectionLabels.es
    map[`/${article.slugs.en}`] = article.sectionLabels.en
  }
  return map
}

export function getEsSlugs(): Set<string> {
  const slugs = new Set<string>(['/', '/privacidad', '/sobre-mi'])
  for (const article of articleRegistry) {
    slugs.add(`/${article.slugs.es}`)
  }
  return slugs
}
