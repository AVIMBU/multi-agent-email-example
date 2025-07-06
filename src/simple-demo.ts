import 'dotenv/config';

// Simplified types for demo
interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
}

interface AgentDecision {
  shouldHandle: boolean;
  confidence: number;
  reasoning: string;
  escalate?: boolean;
}

interface TriageResult {
  emailId: string;
  category: string;
  priority: string;
  assignedAgent: string;
  summary: string;
  requiresHumanReview: boolean;
}

// Sample emails
const sampleEmails: Email[] = [
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
    body: 'Hello, I represent a Fortune 500 company interested in your enterprise solution. We have approximately 10,000 employees and are looking for a comprehensive package. Could you please send me detailed pricing information and schedule a demo?',
    timestamp: new Date('2025-01-15T10:15:00Z')
  },
  {
    id: 'email-003',
    from: 'noreply@newsletter.com',
    to: 'info@company.com',
    subject: 'Weekly Industry Newsletter - AI Trends',
    body: 'This week in AI: Latest developments in machine learning, new funding rounds, and market analysis. Click here to read the full newsletter.',
    timestamp: new Date('2025-01-15T08:00:00Z')
  }
];

// Simplified agent that uses rule-based logic instead of LLM calls
class SimpleTriageAgent {
  
  triageEmail(email: Email): TriageResult {
    console.log(`\n🎯 Processing: ${email.subject}`);
    console.log(`From: ${email.from}`);
    
    let category = 'General';
    let priority = 'medium';
    let assignedAgent = 'General';
    let requiresHumanReview = false;
    
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();
    const text = `${subject} ${body}`;
    
    // Spam detection
    if (email.from.includes('noreply') || text.includes('newsletter') || text.includes('unsubscribe')) {
      category = 'Spam/Newsletter';
      priority = 'low';
      assignedAgent = 'SpamFilter';
    }
    // Customer Support detection
    else if (text.includes('urgent') || text.includes('critical') || text.includes('down') || 
             text.includes('error') || text.includes('issue') || text.includes('problem') ||
             text.includes('support') || text.includes('help')) {
      category = 'Customer Support';
      assignedAgent = 'CustomerSupport';
      
      if (text.includes('urgent') || text.includes('critical') || text.includes('down')) {
        priority = 'urgent';
        requiresHumanReview = true;
      } else {
        priority = 'high';
      }
    }
    // Sales detection
    else if (text.includes('pricing') || text.includes('demo') || text.includes('enterprise') ||
             text.includes('purchase') || text.includes('buy') || text.includes('quote') ||
             text.includes('inquiry') || text.includes('fortune')) {
      category = 'Sales';
      assignedAgent = 'Sales';
      priority = 'high';
      
      if (text.includes('fortune') || text.includes('enterprise')) {
        requiresHumanReview = true;
      }
    }
    // HR detection
    else if (text.includes('recruit') || text.includes('candidate') || text.includes('resume') ||
             text.includes('job') || text.includes('employee') || text.includes('hr')) {
      category = 'HR';
      assignedAgent = 'HR';
      priority = 'medium';
    }
    
    const result: TriageResult = {
      emailId: email.id,
      category,
      priority,
      assignedAgent,
      summary: `Email categorized as ${category} based on content analysis`,
      requiresHumanReview
    };
    
    console.log(`✅ Result: ${category} | Priority: ${priority.toUpperCase()} | Agent: ${assignedAgent}`);
    if (requiresHumanReview) {
      console.log(`⚠️  Requires human review`);
    }
    
    return result;
  }
}

async function main() {
  console.log('🚀 Multi-Agent Email Triage System (Simplified Demo)');
  console.log('===================================================\n');
  
  const triageAgent = new SimpleTriageAgent();
  const results: TriageResult[] = [];
  
  for (const email of sampleEmails) {
    const result = triageAgent.triageEmail(email);
    results.push(result);
    console.log('─'.repeat(60));
  }
  
  // Summary
  console.log('\n📊 TRIAGE SUMMARY');
  console.log('==================');
  
  const summary = {
    total: results.length,
    byAgent: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    requiresReview: 0
  };

  results.forEach(result => {
    summary.byAgent[result.assignedAgent] = (summary.byAgent[result.assignedAgent] || 0) + 1;
    summary.byPriority[result.priority] = (summary.byPriority[result.priority] || 0) + 1;
    if (result.requiresHumanReview) summary.requiresReview++;
  });

  console.log(`Total emails processed: ${summary.total}`);
  console.log('\nBy Agent:');
  Object.entries(summary.byAgent).forEach(([agent, count]) => {
    console.log(`  ${agent}: ${count} emails`);
  });
  
  console.log('\nBy Priority:');
  Object.entries(summary.byPriority).forEach(([priority, count]) => {
    console.log(`  ${priority.toUpperCase()}: ${count} emails`);
  });
  
  console.log(`\nEmails requiring human review: ${summary.requiresReview}`);
  
  console.log('\n✨ Demo Complete!');
  console.log('\n💡 This simplified version demonstrates the multi-agent concept');
  console.log('   using rule-based logic. The full LangChain.js version with');
  console.log('   AI agents is available in the other source files.');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
