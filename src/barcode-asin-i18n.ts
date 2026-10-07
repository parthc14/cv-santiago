export const barcodeAsinContent = {
  en: {
    header: {
      h1: 'Barcode Linked to Multiple ASINs',
      subtitle: 'Automated inventory transfer from discontinued products to their replacements across 600+ stores',
    },
    nav: {
      breadcrumbHome: 'Home',
      breadcrumbCurrent: 'Barcode Linked to Multiple ASINs',
    },
    sections: {
      overview: {
        title: 'Overview',
        content: [
          'Built at Amazon WW Grocery, this system automatically transfers on-hand inventory from a discontinued product to its replacement when the catalog merges them, across 600+ stores.',
          'I drove the design and implementation across 3 partner teams and mentored 5+ junior engineers through the build.',
        ],
      },
      impact: {
        title: 'Business Impact',
        metrics: [
          { label: 'Projected Annual Savings', value: '$1.55M', description: 'From automating inventory transfers between merged products' },
          { label: 'Reconciliation Time', value: '< 24 hours', description: 'Down from thousands of hours of reconciliation' },
          { label: 'Stores Covered', value: '600+', description: 'Transfers run across the full store network' },
          { label: 'Partner Teams', value: '3', description: 'Design and delivery coordinated across team boundaries' },
        ],
      },
      architecture: {
        title: 'Technical Architecture',
        content: [
          'Event-driven pipeline using AWS SNS and SQS to ingest catalog merge signals',
          'DynamoDB tracks each merge from the moment it is received through completion',
          'Scheduled AWS Batch job re-checks inventory on a cadence and moves stock until it fully clears',
          'S3 snapshots serve inventory lookups for the batch job',
          'DynamoDB TTL cleans up completed merge records automatically',
        ],
      },
      leadership: {
        title: 'Leadership',
        items: [
          'Drove design and implementation across 3 partner teams',
          'Mentored 5+ junior engineers through design, implementation, and delivery',
        ],
      },
      technologies: {
        title: 'Technologies Used',
        categories: [
          { name: 'Messaging', items: ['SNS', 'SQS'] },
          { name: 'Compute', items: ['AWS Batch'] },
          { name: 'Storage', items: ['DynamoDB', 'S3'] },
        ],
      },
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        {
          q: 'What triggers an inventory transfer?',
          a: 'Catalog merge signals. They are published over SNS and consumed through SQS, and each merge is recorded in DynamoDB so its progress can be tracked through completion.',
        },
        {
          q: 'Why a scheduled job instead of a single transfer?',
          a: 'A scheduled AWS Batch job re-checks inventory on a cadence and keeps moving stock until the discontinued product fully clears, rather than relying on a single pass.',
        },
        {
          q: 'How are finished merges cleaned up?',
          a: 'Merge tracking records in DynamoDB carry a TTL, so they expire automatically once they are no longer needed.',
        },
      ],
    },
  },
};
