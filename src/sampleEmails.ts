import { Email } from './types';

/**
 * Sample emails for testing the multi-agent email triage system
 */
export const sampleEmails: Email[] = [
  {
    id: 'email-001',
    from: 'sarah.chen@techcorp.com',
    to: 'support@company.com',
    subject: 'Critical Payment Processing Issue - Urgent',
    body: 'Hi, our payment gateway has been down for the past 2 hours. We\'re losing thousands of dollars per minute. This needs immediate attention. Error code: PAY_GW_500. Please escalate to your technical team ASAP.',
    timestamp: new Date('2025-01-15T14:30:00Z')
  },
  {
    id: 'email-002',
    from: 'john.smith@example.com',
    to: 'sales@company.com',
    subject: 'Inquiry about Enterprise Pricing',
    body: 'Hello, I represent a Fortune 500 company interested in your enterprise solution. We have approximately 10,000 employees and are looking for a comprehensive package. Could you please send me detailed pricing information and schedule a demo? Best regards, John Smith, CTO',
    timestamp: new Date('2025-01-15T10:15:00Z')
  },
  {
    id: 'email-003',
    from: 'noreply@newsletter.com',
    to: 'info@company.com',
    subject: 'Weekly Industry Newsletter - AI Trends',
    body: 'This week in AI: Latest developments in machine learning, new funding rounds, and market analysis. Click here to read the full newsletter.',
    timestamp: new Date('2025-01-15T08:00:00Z')
  },
  {
    id: 'email-004',
    from: 'lisa.wong@customer.com',
    to: 'support@company.com',
    subject: 'Login Issues with Account',
    body: 'I\'ve been trying to log into my account for the past hour but keep getting an "invalid credentials" error. I\'ve tried resetting my password twice but the reset emails aren\'t coming through. My username is lisa.wong and my account ID is CUS-12345.',
    timestamp: new Date('2025-01-15T13:45:00Z')
  },
  {
    id: 'email-005',
    from: 'hr@company.com',
    to: 'all@company.com',
    subject: 'Team Building Event - Next Friday',
    body: 'Dear Team, we\'re organizing a team building event next Friday at the downtown office. Lunch will be provided. Please RSVP by Wednesday. Thanks, HR Department',
    timestamp: new Date('2025-01-15T09:30:00Z')
  },
  {
    id: 'email-006',
    from: 'recruiter@headhunters.com',
    to: 'careers@company.com',
    subject: 'Exceptional Senior Developer Available',
    body: 'We have a senior full-stack developer with 8 years of experience looking for new opportunities. Expert in React, Node.js, and cloud architecture. Available for immediate hire. Would you like to see their resume?',
    timestamp: new Date('2025-01-15T11:20:00Z')
  }
];
