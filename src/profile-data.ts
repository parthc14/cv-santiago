/**
 * Single source of truth for Parth's structured facts — used by the About
 * page's JSON-LD, every article page's JSON-LD (src/articles/json-ld.ts),
 * and the article footer byline (src/articles/components.tsx).
 *
 * Update this file when your resume changes (every 2-3 months) — every
 * consumer above imports from here, so one edit propagates everywhere
 * instead of hunting down hardcoded values across the codebase.
 */

export const PROFILE = {
  name: 'Parth Chitroda',
  jobTitle: 'Backend Engineer',
  company: { name: 'Amazon', url: 'https://www.amazon.com' },
  location: { city: 'Seattle', region: 'WA', country: 'US' },
  email: 'parthchitroda@gmail.com',
  siteUrl: 'https://ctrlaltparth.tech',
  avatarUrl: '/foto-avatar.png',
  linkedin: 'https://www.linkedin.com/in/parth-chitroda',
  github: 'https://github.com/parthc14',
  /** Cal.com event path (cal.com/<this>) for the 30-minute booking button */
  calLink: 'parth-chitroda-agqews/30min',
  bio: 'Backend engineer building secure, scalable, high-performance microservices and APIs — currently at Amazon WW Grocery.',
  education: [
    { institution: 'University of Florida', degree: 'M.S., Computer and Information Sciences', dates: 'Aug 2019 – May 2021' },
  ],
  experience: [
    { company: 'Amazon WW Grocery', role: 'Software Dev. Engineer II', dates: 'Oct 2023 – Present' },
    { company: 'Amazon Physical Stores', role: 'SDE to SDE II', dates: 'Jul 2021 – Oct 2023' },
  ],
  knowsAbout: ['Distributed Systems', 'Microservices', 'Event-Driven Architecture', 'AWS', 'Kafka', 'Java', 'Spring Boot'],
} as const

export const SAME_AS = [PROFILE.linkedin, PROFILE.github]
