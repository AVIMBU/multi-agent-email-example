import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { Email, EmailTriageState, TriageResult } from '../types';
import { CustomerSupportAgent } from './customerSupportAgent';
import { SalesAgent } from './salesAgent';
import { SpamFilterAgent } from './spamFilterAgent';
import { HRAgent } from './hrAgent';

/**
 * Supervisor Agent - Orchestrates the email triage process by coordinating
 * specialist agents and making final decisions about email routing
 */
export class SupervisorAgent {
  private llm: ChatOpenAI;
  private customerSupportAgent: CustomerSupportAgent;
  private salesAgent: SalesAgent;
  private spamFilterAgent: SpamFilterAgent;
  private hrAgent: HRAgent;

  constructor() {
    this.llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.2,
    });
    
    this.customerSupportAgent = new CustomerSupportAgent();
    this.salesAgent = new SalesAgent();
    this.spamFilterAgent = new SpamFilterAgent();
    this.hrAgent = new HRAgent();
  }

  /**
   * Main triage orchestration method
   */
  async triageEmail(email: Email): Promise<TriageResult> {
    console.log(`\n🎯 Supervisor: Starting triage for email "${email.subject}"`);
    
    // Create initial state
    const state: EmailTriageState = {
      email,
      agentDecisions: {},
      requiresEscalation: false
    };
    // Step 1: Check for spam first (most efficient filter)
    console.log('📧 Checking for spam...');
    const spamDecision = await this.spamFilterAgent.evaluate(email);
    state.agentDecisions['SpamFilter'] = spamDecision;
    
    // If likely spam, filter out immediately
    if (spamDecision.shouldHandle && spamDecision.confidence > 70) {
      console.log('🚫 Email identified as spam/low-priority - filtering out');
      return this.createTriageResult(state, 'Spam/Low-Priority', 'low', 'SpamFilter');
    }

    // Step 2: Evaluate with specialist agents in parallel
    console.log('🔍 Evaluating with specialist agents...');
    const [customerSupportDecision, salesDecision, hrDecision] = await Promise.all([
      this.customerSupportAgent.evaluate(email),
      this.salesAgent.evaluate(email),
      this.hrAgent.evaluate(email)
    ]);

    state.agentDecisions['CustomerSupport'] = customerSupportDecision;
    state.agentDecisions['Sales'] = salesDecision;
    state.agentDecisions['HR'] = hrDecision;

    // Step 3: Make routing decision based on agent evaluations
    const finalDecision = await this.makeRoutingDecision(state);
    
    console.log(`✅ Supervisor: Final decision - Route to ${finalDecision.assignedAgent}`);
    return finalDecision;
  }
  /**
   * Make the final routing decision based on all agent evaluations
   */
  private async makeRoutingDecision(state: EmailTriageState): Promise<TriageResult> {
    const decisions = state.agentDecisions;
    
    // Find agents that want to handle this email
    const willingAgents = Object.entries(decisions)
      .filter(([_, decision]) => decision.shouldHandle && decision.confidence > 50)
      .sort(([_, a], [__, b]) => b.confidence - a.confidence);

    console.log(`📊 Agents willing to handle: ${willingAgents.map(([name, decision]) => 
      `${name}(${decision.confidence}%)`).join(', ')}`);

    if (willingAgents.length === 0) {
      // No agent wants to handle - escalate to general
      return this.createTriageResult(state, 'General', 'medium', 'General', true);
    }

    if (willingAgents.length === 1) {
      // Only one agent wants to handle
      const [agentName, decision] = willingAgents[0];
      const priority = this.determinePriority(decision);
      return this.createTriageResult(state, agentName, priority, agentName, decision.escalate);
    }

    // Multiple agents want to handle - use LLM to decide
    return await this.resolveConflict(state, willingAgents);
  }
  /**
   * Resolve conflicts when multiple agents want to handle an email
   */
  private async resolveConflict(
    state: EmailTriageState, 
    willingAgents: [string, any][]
  ): Promise<TriageResult> {
    const { email } = state;
    
    const agentAnalysis = willingAgents.map(([name, decision]) => 
      `${name}: ${decision.reasoning} (Confidence: ${decision.confidence}%)`
    ).join('\n');

    const prompt = `
As a Supervisor Agent, you need to decide which specialist should handle this email.

EMAIL DETAILS:
FROM: ${email.from}
SUBJECT: ${email.subject}
BODY: ${email.body}

AGENT ANALYSES:
${agentAnalysis}

Based on the email content and agent analyses, decide which agent should handle this email.
Consider:
1. Which agent's expertise best matches the email content?
2. Which agent has the highest confidence and best reasoning?
3. What is the appropriate priority level?

Respond in this exact format:
ASSIGNED_AGENT: [AgentName]
PRIORITY: [low/medium/high/urgent]
REASONING: [Brief explanation]
`;

    try {
      const response = await this.llm.invoke(prompt);
      const content = response.content as string;
      
      const agentMatch = content.match(/ASSIGNED_AGENT: (\w+)/);
      const priorityMatch = content.match(/PRIORITY: (low|medium|high|urgent)/);
      const reasoningMatch = content.match(/REASONING: (.+?)(?=\n|$)/);
      
      const assignedAgent = agentMatch ? agentMatch[1] : willingAgents[0][0];
      const priority = priorityMatch ? priorityMatch[1] as any : 'medium';
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Conflict resolved by supervisor';
      
      console.log(`🤔 Supervisor resolved conflict: ${assignedAgent} (${reasoning})`);
      
      return this.createTriageResult(state, assignedAgent, priority, assignedAgent, false);
    } catch (error) {
      console.error('Error in conflict resolution:', error);
      // Fallback to highest confidence agent
      const [fallbackAgent] = willingAgents[0];
      return this.createTriageResult(state, fallbackAgent, 'medium', fallbackAgent, false);
    }
  }
  /**
   * Helper method to determine priority based on agent decision
   */
  private determinePriority(decision: any): 'low' | 'medium' | 'high' | 'urgent' {
    if (decision.escalate) return 'urgent';
    if (decision.confidence > 90) return 'high';
    if (decision.confidence > 70) return 'medium';
    return 'low';
  }

  /**
   * Helper method to create triage result
   */
  private createTriageResult(
    state: EmailTriageState,
    category: string,
    priority: 'low' | 'medium' | 'high' | 'urgent',
    assignedAgent: string,
    requiresHumanReview: boolean = false
  ): TriageResult {
    const assignedDecision = state.agentDecisions[assignedAgent];
    
    return {
      emailId: state.email.id,
      category,
      priority,
      assignedAgent,
      summary: assignedDecision?.reasoning || `Email categorized as ${category}`,
      suggestedActions: assignedDecision?.suggestedActions || [`Route to ${assignedAgent} team`],
      requiresHumanReview
    };
  }
}
