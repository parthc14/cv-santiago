export const hawkContent = {
  en: {
    header: {
      h1: 'HAWK: Predictive Operations Intelligence Platform',
      subtitle: 'Multi-site operational intelligence with subprocess-level bottleneck detection',
    },
    nav: {
      breadcrumbHome: 'Home',
      breadcrumbCurrent: 'HAWK',
    },
    sections: {
      overview: {
        title: 'Overview',
        content: [
          'HAWK is a multi-site operational intelligence platform built at Amazon WW Grocery that provides real-time visibility into operational performance across warehouse sites.',
          'The platform combines distributed systems architecture with machine learning to detect bottlenecks, perform predictive analytics, and enable data-driven decision making.',
        ],
      },
      impact: {
        title: 'Business Impact',
        metrics: [
          { label: 'MTTR Reduction', value: '35%', description: 'Faster incident detection and resolution' },
          { label: 'Process Variance Reduction', value: '40%', description: 'More predictable operations' },
          { label: 'Manager Adoption', value: '30% → 85%', description: 'Increased platform usage' },
          { label: 'Overtime Reduction', value: '25%', description: 'Better resource planning' },
        ],
      },
      architecture: {
        title: 'Technical Architecture',
        content: [
          'Hybrid system combining SNS/Lambda event processing with time-series and NoSQL databases',
          'Real-time analytics engine using SageMaker and LLM integration for intelligent insights',
          'Sub-200ms latency requirement met through careful optimization and caching strategies',
          'Microservices architecture enabling independent scaling and deployment',
        ],
      },
      features: {
        title: 'Key Features',
        items: [
          'Subprocess-level bottleneck detection across multiple warehouse sites',
          'Comparative performance benchmarking between sites and time periods',
          'Predictive ETAs using machine learning models',
          'Cyclical pattern detection for capacity planning',
          'Real-time dashboard for operational monitoring',
        ],
      },
      technologies: {
        title: 'Technologies Used',
        categories: [
          { name: 'Cloud', items: ['AWS Lambda', 'SNS', 'SQS', 'EC2', 'CloudWatch'] },
          { name: 'Databases', items: ['DynamoDB', 'Time-series databases', 'Elasticsearch'] },
          { name: 'Analytics', items: ['SageMaker', 'LLM Integration', 'Custom ML models'] },
          { name: 'Languages', items: ['Java', 'Kotlin', 'Python'] },
        ],
      },
      learnings: {
        title: 'Key Learnings',
        content: [
          'Building systems that serve millions of daily operations requires careful attention to performance and reliability',
          'Cross-functional collaboration is essential for understanding operational requirements and delivering impactful solutions',
          'Machine learning can significantly enhance operational intelligence when properly integrated with domain expertise',
          'End-to-end ownership from design through operations ensures accountability and enables rapid iteration',
        ],
      },
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        {
          q: 'How does HAWK detect bottlenecks?',
          a: 'HAWK uses real-time data streams from warehouse operations combined with machine learning models to identify where processes are slowing down. It analyzes subprocess-level metrics and compares against historical patterns and peer sites.',
        },
        {
          q: 'What was the biggest technical challenge?',
          a: 'Meeting the sub-200ms latency requirement while processing data from multiple warehouse sites. We solved this through a hybrid architecture with local caching, optimized queries, and strategic use of time-series databases.',
        },
        {
          q: 'How is the platform maintained and scaled?',
          a: 'HAWK uses microservices deployed on AWS with CI/CD pipelines. Each component can be scaled independently based on demand, and we have automated monitoring and alerting through CloudWatch and custom dashboards.',
        },
        {
          q: 'What role did AI/LLMs play?',
          a: 'We integrated LLMs to generate intelligent insights from operational data, provide natural language explanations of anomalies, and suggest optimization strategies based on historical context.',
        },
      ],
    },
  },
};
