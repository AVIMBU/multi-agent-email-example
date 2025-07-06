import 'dotenv/config';
import { SupervisorAgent } from './agents/supervisorAgent';
import { sampleEmails } from './sampleEmails';
import { TriageResult } from './types';

/**
 * Multi-Agent Email Triage System
 * 
 * This system demonstrates a sophisticated multi-agent approach to email triage,
 * where specialized AI agents work together to categorize, prioritize, and route
 * incoming emails to the appropriate departments.
 */

async function main() {
  console.log('🚀 Starting Multi-Agent Email Triage System');
  console.log('==============================================\n');

  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is required');
    console.log('Please set your OpenAI API key in a .env file:');
    console.log('OPENAI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  // Initialize supervisor agent
  const supervisor = new SupervisorAgent();
  const results: TriageResult[] = [];

  console.log(`📧 Processing ${sampleEmails.length} sample emails...\n`);

  // Process each email
  for (let i = 0; i < sampleEmails.length; i++) {
    const email = sampleEmails[i];
    console.log(`\n📨 Email ${i + 1}/${sampleEmails.length}`);
    console.log(`From: ${email.from}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Preview: ${email.body.substring(0, 100)}...`);
    console.log('─'.repeat(50));

    try {
      const result = await supervisor.triageEmail(email);
      results.push(result);
      
      console.log(`\n✅ TRIAGE RESULT:`);
      console.log(`   Category: ${result.category}`);
      console.log(`   Priority: ${result.priority.toUpperCase()}`);
      console.log(`   Assigned to: ${result.assignedAgent}`);
      console.log(`   Summary: ${result.summary}`);
      if (result.suggestedActions.length > 0) {
        console.log(`   Actions: ${result.suggestedActions.join(', ')}`);
      }
      if (result.requiresHumanReview) {
        console.log(`   ⚠️  Requires human review`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing email ${email.id}:`, error);
    }
    
    console.log('='.repeat(70));
  }
  // Display summary
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
  
  console.log('\n✨ Multi-Agent Email Triage Complete!');
}

// Handle errors gracefully
main().catch(error => {
  console.error('❌ Application error:', error);
  process.exit(1);
});
