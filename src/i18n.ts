export type Lang = 'en'

export const seo = {
  en: {
    title: 'Parth Chitroda | Software Engineer',
    description:
      'SDE II at Amazon. Designing scalable distributed systems and operational intelligence. Seattle, WA. Java, Kotlin, Python, TypeScript.',
  },
};

export const translations = {
  en: {
    greeting: 'shipping scalable systems at Amazon',
    greetingRoles: ['SDE II', 'Systems Designer', 'Infrastructure Architect'],
    pillLabels: ['Builder', 'Systems Thinker'],
    email: 'parthchitroda@gmail.com',
    role: '',
    story: {
      context: 'Designing high-scale systems that serve millions of operations daily.',
      reflections: ['Systems that scale.', 'Impact that compounds.'],
      hookParagraphs: [
        ['Building predictive operations intelligence at Amazon.'],
        [
          'From e-commerce to cloud infrastructure.',
          '*Owned* +full-stack systems end-to-end+.',
        ],
      ],
      why: 'At Amazon I built HAWK, a multi-site operational intelligence platform. I also have a growing interest in AI and automation — exploring how LLMs and intelligent agents can enhance operational systems.',
      seeking: [
        'Solving hard distributed systems problems.',
        'Teams tackling infrastructure challenges.',
        'Exploring AI driven automations to make life simpler for myself.',
      ],
      nav: [
        { icon: 'briefcase', label: 'My path', href: '#experience' },
        { icon: 'zap', label: 'AI & Automation', href: '#ai-automation' },
        { icon: 'mail', label: "Let's talk", href: '#contact' },
        { icon: 'bot', label: 'Ask me', href: '#chat', highlight: true },
      ],
      skills: [
        'System Design',
        'Cloud Architecture',
        'Distributed Systems',
        'LLM Integration',
        'Performance Optimization',
        'Technical Leadership',
      ],
      skipButton: 'Skip intro',
    },
    taglines: [] as readonly string[],
    location: 'Seattle, WA · USA',
    roles: ['Software Development Engineer II', 'AWS Specialist', 'Systems Architect'],
    summary: {
      title: 'Professional Summary',
      p1: 'SDE II at Amazon focused on',
      p1Highlight: 'high-scale distributed systems and operational excellence',
      p1End:
        '. I design and build systems that handle millions of operations daily, from predictive analytics platforms to serverless microservices.',
      p2: 'End-to-end ownership across',
      p2Highlight: 'architecture → implementation → optimization → operations',
      p2End: ', collaborating across product, infrastructure, and leadership teams.',
      cards: [
        {
          title: 'Systems Thinking',
          desc: 'Design complex systems that scale: hybrid architectures, distributed tracing, performance optimization',
        },
        {
          title: 'Execution Excellence',
          desc: 'Deliver at scale: zero-downtime migrations, measurable impact (35% MTTR reduction, 49% perf improvement)',
        },
        {
          title: 'Technical Leadership',
          desc: 'Lead teams through system design, code reviews, and incident response. Build for production.',
        },
      ],
    },
    coreCompetencies: {
      title: 'Core Competencies',
      items: [
        {
          title: 'Distributed Systems Design',
          desc: 'Microservices, serverless architectures, event-driven systems, data consistency patterns',
        },
        {
          title: 'Performance Optimization',
          desc: 'Latency reduction, throughput scaling, resource efficiency, monitoring and profiling',
        },
        {
          title: 'Database Architecture',
          desc: 'SQL/NoSQL design, data modeling, migration strategies, query optimization',
        },
        {
          title: 'Team Leadership',
          desc: 'System design reviews, code reviews, mentoring engineers, incident response',
        },
      ],
    },
    aiAutomation: {
      title: 'AI & Automation Interest',
      subtitle: 'Combining systems expertise with AI to build smarter operations',
      desc: 'Growing interest in exploring how AI and automation can enhance operational systems, developer productivity, and system intelligence.',
      sections: [
        {
          icon: 'sparkles',
          title: 'LLM Integration',
          desc: 'Integrating Claude, GPT models, and other LLMs into systems for intelligent automation and decision-making',
        },
        {
          icon: 'zap',
          title: 'Workflow Automation',
          desc: 'Building automated systems using modern AI tools to reduce manual toil and improve operational efficiency',
        },
        {
          icon: 'bot',
          title: 'Intelligent Agents',
          desc: 'Designing agentic systems that can make decisions, take actions, and adapt based on operational context',
        },
        {
          icon: 'trending-up',
          title: 'AI-Driven Operations',
          desc: 'Applying AI to operational intelligence, predictive analytics, anomaly detection, and system optimization',
        },
      ],
    },
    techStack: {
      title: 'Tech Stack',
      categories: [
        {
          name: 'Languages',
          items: ['Java', 'Kotlin', 'Python', 'JavaScript', 'TypeScript', 'SQL'],
        },
        {
          name: 'Cloud & Infrastructure',
          items: ['AWS (Lambda, API Gateway, DynamoDB, SQS, SageMaker, EC2)', 'Docker', 'Kubernetes', 'CI/CD'],
        },
        {
          name: 'Databases',
          items: ['DynamoDB', 'PostgreSQL', 'Time-series DBs', 'Elasticsearch'],
        },
        {
          name: 'AI Tools',
          items: ['Claude API', 'GitHub Copilot', 'SageMaker', 'Prompt Engineering', 'LLM Integration'],
        },
        {
          name: 'Monitoring',
          items: ['CloudWatch', 'X-Ray', 'Application Performance Monitoring', 'Custom Metrics'],
        },
      ],
    },
    experience: {
      title: 'Work Experience',
      amazonGrocery: {
        company: 'Amazon WW Grocery',
        location: 'Seattle, WA',
        role: 'Software Development Engineer II',
        period: 'October 2023 – Present',
        highlights: [
          'HAWK: Predictive Operations Intelligence — Multi-site operational intelligence platform with subprocess-level bottleneck detection, comparative performance benchmarking, and predictive ETAs.',
          'Architected hybrid system (SNS/Lambda, time-series + NoSQL, SageMaker + LLM) achieving sub-200ms latency, reducing MTTR by ~35% and process variance by 40%.',
          'Built time-series analytics engine surfacing cyclical patterns; increased manager adoption from 30% to 85% and reduced unplanned overtime by 25%.',
          'Grocery Identification Microservice — Owned end-to-end design of near real-time event processing service consuming 10K-100K inventory updates/day.',
          'Built scalable queue-based infrastructure with serverless compute and retry logic, enabling 6+ services to consume events with zero code changes.',
          'Led 3 engineers through system design reviews, implementation, code reviews, automated testing, deployment, and monitoring.',
          'Multi-Region Data Migration — Re-architected inventory datastore from relational to NoSQL (DynamoDB), achieving 10x throughput scalability while reducing infrastructure costs by 10%.',
          'Designed and executed zero-downtime migration of 10M+ records with < 5 minutes downtime and comprehensive validation across multiple regions.',
        ],
      },
      amazonStores: {
        company: 'Amazon Physical Stores',
        location: 'Seattle, WA',
        role: 'SDE to SDE II',
        period: 'July 2021 – October 2023',
        highlights: [
          'Cloud & Infrastructure Migration — Migrated high-traffic backend microservice to serverless Lambda + API Gateway architecture, reducing infrastructure costs by 50%.',
          'Developed migration scripts for 100+ fulfillment centers worldwide, orchestrating SKU data transfer and enabling full deprecation of legacy warehouse management system.',
          'Tool Modernization & Performance — Led migration of 3+ internal tools from AngularJS to React, designing incremental rollout with feature flags for safe, reversible production deployments.',
          'Optimized web application performance by 49% (5s to 2.4s) through bundle analysis and dependency optimization, saving ~$68 per user in operational costs.',
        ],
      },
    },
    education: {
      title: 'Education',
      items: [
        {
          year: '2019 - 2021',
          org: 'University of Florida',
          title: 'M.S., Computer and Information Sciences',
          desc: 'Gainesville, FL',
        },
      ],
    },
    certifications: {
      title: 'Certifications',
      items: [],
    },
    skills: {
      title: 'Skills',
      languages: 'Languages',
      english: 'English',
      native: 'Native',
      technical: 'Technical Skills',
      soft: 'Soft Skills',
      softSkills: [
        'System Design',
        'Leadership',
        'Problem Solving',
        'E2E Ownership',
        'Bias for Action',
        'Cross-functional Collaboration',
        'Dealing with Ambiguity',
      ],
    },
    cta: {
      title: "Let's talk",
      desc: 'Passionate about building systems that scale. Always interested in discussing distributed systems challenges, cloud architecture, operational excellence, and AI-driven automation.',
      contact: 'Contact',
    },
    ui: {
      languageBanner: '',
      languageBannerSwitch: '',
      languageBannerSwitchPrefix: '',
      languageBannerSwitchLang: '',
      languageToggle: 'EN',
      typingIndicator: 'Parth is typing...',
    },
    chat: {
      placeholder: 'Type your question...',
      title: 'Parth',
      subtitle: 'Ask me about my experience',
      greeting:
        "Hi! I'm **Parth Chitroda**. Ask me about my experience at Amazon, system design, distributed systems, or AI/automation interests.",
      error: 'Error sending message. Try again.',
      offline: 'No internet connection. Check your network and try again.',
      voice: {
        toggle: 'Voice',
        search: 'Searching my knowledge base...',
        searching: 'Searching my knowledge base...',
        thinking: 'Thinking...',
        listening: 'Listening...',
        speaking: 'Speaking...',
        connection: 'Connecting...',
        connecting: 'Connecting to voice...',
        start: 'Start voice',
        stop: 'Stop',
        switchToText: 'Switch to text',
      },
      prompts: [
        { query: "What's your experience with distributed systems?", icon: 'zap', label: 'Distributed Systems' },
        { query: 'Tell me about HAWK', icon: 'brain', label: 'HAWK Platform' },
        { query: 'How do you approach system design?', icon: 'target', label: 'System Design' },
        { query: 'What interests you about AI and automation?', icon: 'sparkles', label: 'AI & Automation' },
      ],
      contactCtaTitle: "Let's work together",
    },
  },
};
