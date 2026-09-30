PARTH CHITRODA
Backend Engineer | Distributed Systems | Microservices
Seattle, WA • +1 (352) 871-4073 • parthchitroda@gmail.com • linkedin.com/in/parth-chitroda • ctrlaltparth.tech

CAREER SUMMARY
Software Engineer with 5+ years experience designing, developing, and maintaining secure, scalable, and high-performance microservices and
APIs using Java, Spring Boot, and Kafka. Proficient in test-driven development, CI/CD pipelines, and cloud platforms including AWS and Azure.
Experienced with PostgreSQL, ElastiCache, Docker, Kubernetes, and event-driven architectures.

WORK EXPERIENCE

AMAZON WW GROCERY — Seattle, WA
Software Dev. Engineer II — Oct 2023 – Present

Barcode Linked to Multiple ASINs
- Drove design and implementation across 3 partner teams, mentoring 5+ junior engineers to build a system that automatically transfers on-hand inventory from a discontinued product to its replacement across 600+ stores, projected to save $1.55M annually.
- Built an event-driven pipeline using AWS SNS and SQS to ingest catalog merge signals and DynamoDB to track each merge through completion, cutting reconciliation from thousands of hours to under 24 hours.
- Ran a scheduled AWS Batch job that re-checks inventory on a cadence and moves stock until it fully clears, using S3 snapshots for lookups and DynamoDB TTL for automatic cleanup.

Omnichannel Store Inventory Accounting
- Implemented the design that brought SOP changes to enable real-time unit-level tracking of previously untracked customer-facing shelf stock, driving approximately $1M of unaccounted inventory across 15 planned US sites into accurate financial reporting.
- Designed the inventory-accounting foundation for a new store format that unifies in-store retail and online fulfillment, recording every inventory movement across 15+ associate tools into the Amazon financial ledger.
- Designed the online-availability model that reserves a portion of shelf stock for walk-in customers, preventing the store from overselling online what in-store shoppers are actively buying.

HAWK: Predictive Operations Intelligence
- Built HAWK with data scientists: multi-site operational intelligence platform with subprocess-level bottleneck detection, comparative benchmarking, and predictive ETAs.
- Architected scalable, reliable microservices system using AWS SNS and Lambda for event processing, time-series databases and NoSQL for data storage, and AWS SageMaker with LLMs for predictive modeling, achieving sub-200ms latency, reducing MTTR by 35% and process variance by 40%.
- Built time-series analytics engine surfacing cyclical patterns; monitored production performance and improved system reliability, increasing store manager adoption from 30% to 85%.

Grocery Identification Microservice
- Designed a near real-time event processing layer consuming 10K-100K inventory updates/day using Kafka-style queue-based messaging to distinguish grocery items from Amazon Core Inventory.
- Built scalable queue-based infrastructure using serverless compute to deliver reliable processing and retries, enabling 6+ dependent services to consume grocery-only events with zero code changes.
- Centralized filtering logic in an existing microservice, reducing duplication across microservices and improving long-term maintainability.

AMAZON PHYSICAL STORES — Seattle, WA
SDE to SDE II — Jul 2021 – Oct 2023

Tool Modernization & Performance
- Led migration of 3+ tools from AngularJS to React, designing incremental rollout with feature flags and automated test strategies for safe, reversible deployments.
- Optimized application performance by 49% through profiling and dependency optimization, saving $68 per user; saved $63K/month through workflow automation.

EDUCATION
UNIVERSITY OF FLORIDA — Gainesville, FL
M.S., Computer and Information Sciences — Aug 2019 – May 2021

SKILLS
Languages: Java, Kotlin, Python, JavaScript, TypeScript, SQL
Backend: Spring Boot, Kafka, RESTful APIs, Microservices, Event-Driven, Distributed Systems, Reliability, ElastiCache
Cloud & Infra: AWS, Azure, Lambda, API Gateway, SQS, SageMaker, EC2, S3, DynamoDB, MySQL, PostgreSQL, Docker, Kubernetes
Practices & Tools: CI/CD, Jenkins, GitHub, TDD, Code Reviews, Pair Programming, Agile/XP, LLM Integration
