export type AboutLang = 'en'

export const aboutContent = {
  en: {
    altSlug: 'sobre-mi',
    seo: { title: 'About Parth Chitroda', description: 'SDE II at Amazon. Designing scalable distributed systems and operational intelligence.' },
    slug: 'about',
    heading: 'Parth Chitroda',
    subtitle: 'SDE II at Amazon · Systems Architect',
    location: 'Seattle, WA',
    lastUpdated: '2021',
    manifesto: 'Designing high-scale systems that serve millions of operations daily. From e-commerce to cloud infrastructure, I own full-stack systems end-to-end.',
    bio: [
      'SDE II at Amazon focused on high-scale distributed systems and operational excellence. I design and build systems that handle millions of operations daily, from predictive analytics platforms to serverless microservices.',
      'End-to-end ownership across architecture → implementation → optimization → operations, collaborating across product, infrastructure, and leadership teams.',
    ],
    seeking: '',
    roles: [] as any[],
    timelineHeading: 'Experience',
    timeline: [
      {
        period: '2024',
        role: 'Software Development Engineer II',
        company: 'Amazon',
        desc: 'Building and scaling distributed systems. Designed HAWK platform for operational intelligence with subprocess-level bottleneck detection across multiple warehouse sites. Achieved 35% MTTR reduction and 40% process variance reduction.'
      },
      {
        period: '2021–2023',
        role: 'Software Development Engineer',
        company: 'Amazon',
        desc: 'Owned full-stack systems for operational intelligence and real-time data processing. Built microservices for inventory management handling 10K-100K events daily with sub-second latency.'
      },
    ],
    projectsHeading: 'Projects',
    projects: [
      {
        name: 'HAWK: Predictive Operations Intelligence Platform',
        href: '/hawk',
        desc: 'Multi-site operational intelligence system with subprocess-level bottleneck detection and predictive analytics using hybrid architecture (SNS/Lambda + time-series + ML).'
      },
      {
        name: 'Grocery Identification Microservice',
        href: '/grocery-identification',
        desc: 'Near real-time inventory event processing microservice handling 10K-100K events daily with idempotent processing and distributed transaction patterns.'
      },
    ],
    educationHeading: 'Education',
    education: [
      {
        period: '2019–2021',
        school: 'University of Florida',
        degree: 'MS in Computer and Information Sciences',
        desc: ''
      },
    ],
    certificationsHeading: 'Certifications',
    certifications: [] as any[],
    pressHeading: 'Press',
    press: [] as any[],
    communityHeading: 'Community',
    community: [] as any[],
    faqHeading: 'FAQ',
    faq: [] as any[],
    connectHeading: 'Connect',
    email: 'parthchitroda@gmail.com',
    awards: [] as never[],
    testimonials: [] as never[],
  },
}
