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

/** Card shown in the home page's Work Summary section */
export interface ArticleSummary {
  org: string
  period: string
  blurb: string
  stats: Array<{ value: string; label: string }>
  tags: string[]
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
  summary?: ArticleSummary
}

// Parth's portfolio articles
export const articleRegistry: ArticleConfig[] = [
  {
    id: 'barcode-multi-asin',
    slugs: { es: 'barcode-multi-asin', en: 'barcode-multi-asin' },
    titles: { es: 'Barcode Linked to Multiple ASINs', en: 'Barcode Linked to Multiple ASINs' },
    seo: {
      es: {
        title: 'Barcode Linked to Multiple ASINs: Automated Inventory Transfer',
        description: 'Event-driven system that moves on-hand inventory from discontinued products to their replacements across 600+ stores',
      },
      en: {
        title: 'Barcode Linked to Multiple ASINs: Automated Inventory Transfer',
        description: 'Event-driven system that moves on-hand inventory from discontinued products to their replacements across 600+ stores',
      },
    },
    sectionLabels: { es: {}, en: {} },
    type: 'case-study',
    component: () => import('./BarcodeAsin').then(m => ({ default: m.default })),
    ragReady: true,
    i18nFile: 'src/barcode-asin-i18n.ts',
    summary: {
      org: 'Amazon WW Grocery',
      period: '2023 – Present',
      blurb: 'Automatically transfers on-hand inventory from a discontinued product to its replacement when the catalog merges them.',
      stats: [
        { value: '$1.55M', label: 'projected annual savings' },
        { value: '600+', label: 'stores' },
        { value: '< 24h', label: 'reconciliation, from thousands of hours' },
      ],
      tags: ['SNS', 'SQS', 'DynamoDB', 'AWS Batch', 'S3'],
    },
    seoMeta: {
      datePublished: '2026-10-07',
      dateModified: '2026-10-07',
      keywords: ['event-driven architecture', 'inventory management', 'AWS', 'DynamoDB', 'catalog merge'],
      articleType: 'TechArticle',
      articleTags: 'event-driven,aws,inventory,dynamodb',
      images: [],
      about: [{ name: 'Amazon WW Grocery' }],
    },
  },
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
    i18nFile: 'src/hawk-i18n.ts',
    summary: {
      org: 'Amazon WW Grocery',
      period: '2023 – Present',
      blurb: 'Multi-site operational intelligence platform with subprocess-level bottleneck detection, cross-site benchmarking, and predictive ETAs.',
      stats: [
        { value: '35%', label: 'lower MTTR' },
        { value: '40%', label: 'less process variance' },
        { value: '30→85%', label: 'manager adoption' },
      ],
      tags: ['AWS Lambda', 'SNS', 'SageMaker', 'DynamoDB', 'Java'],
    },
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
    i18nFile: 'src/grocery-ident-i18n.ts',
    summary: {
      org: 'Amazon WW Grocery',
      period: '2023 – Present',
      blurb: 'Near real-time event processing layer that separates grocery items from Amazon Core Inventory for downstream consumers.',
      stats: [
        { value: '10K–100K', label: 'events / day' },
        { value: '6+', label: 'services onboarded' },
        { value: '0', label: 'consumer code changes' },
      ],
      tags: ['SNS', 'SQS', 'AWS Lambda', 'DynamoDB', 'Kotlin'],
    },
    seoMeta: {
      datePublished: '2023-10-01',
      dateModified: '2026-10-07',
      keywords: ['microservices', 'event processing', 'AWS', 'inventory management', 'real-time systems'],
      articleType: 'TechArticle',
      articleTags: 'microservices,aws,event-processing,inventory',
      images: [],
      about: [{ name: 'Amazon WW Grocery' }],
    },
  },
  {
    id: 'multi-region-migration',
    slugs: { es: 'multi-region-migration', en: 'multi-region-migration' },
    titles: { es: 'Multi-Region Data Migration', en: 'Multi-Region Data Migration' },
    seo: {
      es: {
        title: 'Multi-Region Data Migration: Relational to DynamoDB',
        description: 'Re-architected an inventory datastore to DynamoDB and migrated 10M+ records across regions with under 5 minutes of downtime',
      },
      en: {
        title: 'Multi-Region Data Migration: Relational to DynamoDB',
        description: 'Re-architected an inventory datastore to DynamoDB and migrated 10M+ records across regions with under 5 minutes of downtime',
      },
    },
    sectionLabels: { es: {}, en: {} },
    type: 'case-study',
    component: () => import('./MultiRegionMigration').then(m => ({ default: m.default })),
    ragReady: true,
    i18nFile: 'src/multi-region-migration-i18n.ts',
    summary: {
      org: 'Amazon WW Grocery',
      period: '2023 – Present',
      blurb: 'Re-architected an inventory datastore from relational to DynamoDB and migrated it across multiple regions.',
      stats: [
        { value: '10x', label: 'throughput scalability' },
        { value: '10M+', label: 'records migrated' },
        { value: '< 5 min', label: 'downtime' },
      ],
      tags: ['DynamoDB', 'AWS', 'Multi-region', 'Data migration'],
    },
    seoMeta: {
      datePublished: '2026-10-07',
      dateModified: '2026-10-07',
      keywords: ['data migration', 'DynamoDB', 'NoSQL', 'multi-region', 'AWS'],
      articleType: 'TechArticle',
      articleTags: 'migration,dynamodb,aws,multi-region',
      images: [],
      about: [{ name: 'Amazon WW Grocery' }],
    },
  },
]

export function getPageTitles(): Record<string, string> {
  const map: Record<string, string> = {
    '/': "Parth's Portfolio",
    '/about': 'About',
  }
  for (const article of articleRegistry) {
    map[`/${article.slugs.en}`] = article.titles.en
  }
  return map
}

export function getSectionLabels(): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {}
  for (const article of articleRegistry) {
    map[`/${article.slugs.en}`] = article.sectionLabels.en
  }
  return map
}
