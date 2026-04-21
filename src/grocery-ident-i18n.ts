export const groceryIdentContent = {
  en: {
    header: {
      h1: 'Grocery Identification Microservice',
      subtitle: 'Near real-time inventory event processing at scale',
    },
    nav: {
      breadcrumbHome: 'Home',
      breadcrumbCurrent: 'Grocery Identification',
    },
    sections: {
      overview: {
        title: 'Overview',
        content: [
          'Built at Amazon Physical Stores, the Grocery Identification Microservice processes 10K-100K inventory updates per day in near real-time.',
          'This service provides the foundation for inventory accuracy, supply chain optimization, and operational decision-making across physical grocery stores.',
        ],
      },
      requirements: {
        title: 'Key Requirements',
        items: [
          'Process 10,000 to 100,000 inventory events daily',
          'Sub-second latency for event processing',
          'High availability and fault tolerance',
          'Scalable to handle peak traffic periods',
          'Integration with downstream systems (inventory management, analytics)',
        ],
      },
      architecture: {
        title: 'System Design',
        content: [
          'Event-driven microservice using SNS/SQS for message handling',
          'Distributed processing to handle variable load patterns',
          'DynamoDB for low-latency state management',
          'Lambda functions for serverless compute',
          'Comprehensive monitoring and alerting via CloudWatch',
        ],
      },
      challenges: {
        title: 'Technical Challenges & Solutions',
        items: [
          {
            challenge: 'Volume Variability',
            solution: 'Auto-scaling policies to handle 10x variance in daily load',
          },
          {
            challenge: 'Data Consistency',
            solution: 'Idempotent processing and distributed transaction patterns',
          },
          {
            challenge: 'Latency Requirements',
            solution: 'Optimized database queries and in-memory caching',
          },
          {
            challenge: 'Integration Complexity',
            solution: 'Event schema versioning and backward compatibility',
          },
        ],
      },
      technologies: {
        title: 'Technologies Used',
        categories: [
          { name: 'Messaging', items: ['SNS', 'SQS'] },
          { name: 'Compute', items: ['AWS Lambda', 'EC2'] },
          { name: 'Storage', items: ['DynamoDB', 'S3'] },
          { name: 'Monitoring', items: ['CloudWatch', 'X-Ray'] },
          { name: 'Languages', items: ['Java', 'Kotlin'] },
        ],
      },
      impact: {
        title: 'Business Impact',
        content: [
          'Provides real-time inventory visibility for store managers and supply chain teams',
          'Enables proactive inventory management and reduces stock-outs',
          'Foundation for ML models that predict demand and optimize shelf space',
          'Improved operational efficiency across store network',
        ],
      },
      learnings: {
        title: 'Key Learnings',
        content: [
          'End-to-end ownership from design through operations is critical for system reliability',
          'Careful attention to distributed systems patterns (idempotency, eventual consistency) is essential at scale',
          'Monitoring and observability must be built in from day one, not added later',
          'Understanding upstream and downstream dependencies is crucial for successful integration',
        ],
      },
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        {
          q: 'How does the service handle variable load (10K-100K events/day)?',
          a: 'We use auto-scaling policies on Lambda and SQS to automatically adjust capacity based on incoming traffic. During peak hours, the system scales horizontally to handle the increased load.',
        },
        {
          q: 'What happens if an event fails to process?',
          a: 'Events are idempotently processed with automatic retries. Dead-letter queues capture events that fail after retries for manual investigation and recovery.',
        },
        {
          q: 'How is data consistency maintained?',
          a: 'We use DynamoDB transactions for critical state changes and implement distributed transaction patterns to ensure consistency across services.',
        },
        {
          q: 'How do you monitor and debug issues?',
          a: 'CloudWatch provides metric collection, X-Ray enables distributed tracing, and custom dashboards give visibility into service health and performance.',
        },
      ],
    },
  },
};
