export const multiRegionMigrationContent = {
  en: {
    header: {
      h1: 'Multi-Region Data Migration',
      subtitle: 'Re-architecting an inventory datastore from relational to DynamoDB across multiple regions',
    },
    nav: {
      breadcrumbHome: 'Home',
      breadcrumbCurrent: 'Multi-Region Data Migration',
    },
    sections: {
      overview: {
        title: 'Overview',
        content: [
          'Built at Amazon WW Grocery, this project re-architected an inventory datastore from a relational database to NoSQL (DynamoDB) to unlock higher throughput at lower cost.',
          'I designed and executed the migration of 10M+ records across multiple regions, keeping downtime under 5 minutes with comprehensive validation at every step.',
        ],
      },
      impact: {
        title: 'Business Impact',
        metrics: [
          { label: 'Throughput Scalability', value: '10x', description: 'Headroom gained by moving to DynamoDB' },
          { label: 'Infrastructure Cost', value: '−10%', description: 'Lower cost than the relational datastore' },
          { label: 'Records Migrated', value: '10M+', description: 'Moved across multiple regions' },
          { label: 'Downtime', value: '< 5 min', description: 'For the entire cutover' },
        ],
      },
      approach: {
        title: 'Migration Approach',
        content: [
          'Re-modeled the inventory datastore from relational tables to DynamoDB',
          'Migrated 10M+ records across multiple regions',
          'Ran comprehensive validation to confirm data correctness in every region',
          'Planned the cutover to keep downtime under 5 minutes',
        ],
      },
      technologies: {
        title: 'Technologies Used',
        categories: [
          { name: 'Source', items: ['Relational database'] },
          { name: 'Target', items: ['DynamoDB'] },
          { name: 'Cloud', items: ['AWS (multi-region)'] },
        ],
      },
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        {
          q: 'Why move from a relational database to DynamoDB?',
          a: 'The move to NoSQL gave the inventory datastore 10x throughput scalability while reducing infrastructure costs by 10%.',
        },
        {
          q: 'How much data was migrated, and with how much downtime?',
          a: 'More than 10 million records across multiple regions, with under 5 minutes of downtime.',
        },
        {
          q: 'How was correctness verified?',
          a: 'Every region went through comprehensive validation as part of the migration before cutover was considered complete.',
        },
      ],
    },
  },
};
