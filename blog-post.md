# Building Multi-Agent Systems: A Complete Guide with Email Triage Example

## Introduction

Multi-agent systems represent a powerful approach to solving complex problems by breaking them down into smaller, specialized components. A multiagent system (MAS) consists of multiple artificial intelligence (AI) agents working collectively to perform tasks on behalf of a user or another system.

In this guide, we'll explore what multi-agent systems are, why they're useful, and walk through building a practical email triage system using LangChain.js and LangGraph.

## What Are Multi-Agent Systems?

Each agent can have its own prompt, LLM, tools, and other custom code to best collaborate with the other agents. Think of it like having a team of specialists, where each expert focuses on their domain of expertise rather than one generalist trying to handle everything.

### Key Benefits of Multi-Agent Systems

Grouping tools/responsibilities can give better results. An agent is more likely to succeed on a focused task than if it has to select from dozens of tools. Here are the main advantages:

**Modularity**: Separate agents make it easier to develop, test, and maintain complex systems. You can update one agent without affecting others.

**Specialization**: Each agent becomes an expert in its domain, leading to better performance than a single general-purpose agent.

**Scalability**: Multiagent systems can adjust to varying environments by adding, removing or adapting agents.

**Control**: You have explicit control over how agents communicate and when they're activated.

## Multi-Agent Architectures

There are several ways to connect agents in a multi-agent system:

### 1. Supervisor Architecture
Each agent communicates with a single supervisor agent. Supervisor agent makes decisions on which agent should be called next. This is perfect for our email triage system where we need centralized decision-making.

### 2. Network Architecture  
Each agent can communicate with every other agent. Any agent can decide which other agent to call next. This works well when there's no clear hierarchy.

### 3. Hierarchical Architecture
You can define a multi-agent system with a supervisor of supervisors. This enables complex, nested team structures.

## Building an Email Triage System

Let's build a practical multi-agent email triage system that automatically categorizes and routes incoming emails to the right departments. Our system will use the supervisor architecture with specialized agents for different email types.

### System Architecture

Our email triage system consists of:

1. **Supervisor Agent**: Orchestrates the triage process and makes final routing decisions
2. **Customer Support Agent**: Handles technical issues and customer inquiries  
3. **Sales Agent**: Manages business inquiries and lead qualification
4. **HR Agent**: Processes recruitment and employee-related emails
5. **Spam Filter Agent**: Identifies and filters low-priority communications

### Step 1: Project Setup

First, let's set up our TypeScript project with the necessary dependencies:

```bash
mkdir multi-agent-email-triage
cd multi-agent-email-triage
npm init -y
```

Install the required packages:

```bash
npm install @langchain/core @langchain/langgraph @langchain/openai dotenv zod
npm install -D typescript @types/node ts-node
```

Create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS", 
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 2: Define Types

Create `src/types.ts` to define our data structures:

```typescript
export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
}

export interface TriageResult {
  emailId: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent: string;
  summary: string;
  suggestedActions: string[];
  requiresHumanReview: boolean;
}

export interface AgentDecision {
  shouldHandle: boolean;
  confidence: number;
  reasoning: string;
  suggestedActions?: string[];
  escalate?: boolean;
}
```

### Step 3: Implement Base Agent

Create `src/agents/baseAgent.ts`:

```typescript
import { Email, AgentDecision } from '../types';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

export abstract class BaseAgent {
  protected name: string;
  protected llm: ChatOpenAI;
  protected prompt: PromptTemplate;

  constructor(name: string) {
    this.name = name;
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.1,
    });
  }

  abstract evaluate(email: Email): Promise<AgentDecision>;

  protected async generateDecision(email: Email, systemPrompt: string): Promise<AgentDecision> {
    try {
      const prompt = `${systemPrompt}

Email Details:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Respond with JSON containing:
- shouldHandle: boolean
- confidence: number (0-100)
- reasoning: string
- suggestedActions: string[]
- escalate: boolean`;

      const response = await this.llm.invoke([{ role: 'user', content: prompt }]);
      return JSON.parse(response.content as string);
    } catch (error) {
      console.error(`Error in ${this.name} agent:`, error);
      return {
        shouldHandle: false,
        confidence: 0,
        reasoning: 'Agent error - requires manual review',
        escalate: true
      };
    }
  }
}
```

### Step 4: Implement Specialized Agents

Create `src/agents/customerSupportAgent.ts`:

```typescript
import { BaseAgent } from './baseAgent';
import { Email, AgentDecision } from '../types';

export class CustomerSupportAgent extends BaseAgent {
  constructor() {
    super('CustomerSupport');
  }

  async evaluate(email: Email): Promise<AgentDecision> {
    const systemPrompt = `You are a Customer Support specialist. Evaluate if this email requires customer support attention.

Look for:
- Technical issues, bugs, error messages
- Account access problems
- Feature questions or how-to requests
- Product complaints or feedback
- Billing or subscription issues

Consider the urgency and complexity of the issue.`;

    return this.generateDecision(email, systemPrompt);
  }
}
```

Create `src/agents/salesAgent.ts`:

```typescript
import { BaseAgent } from './baseAgent';
import { Email, AgentDecision } from '../types';

export class SalesAgent extends BaseAgent {
  constructor() {
    super('Sales');
  }

  async evaluate(email: Email): Promise<AgentDecision> {
    const systemPrompt = `You are a Sales specialist. Evaluate if this email represents a sales opportunity.

Look for:
- Pricing inquiries
- Demo or trial requests
- Partnership opportunities
- Enterprise or bulk purchase interest
- Competitor comparisons
- Budget discussions

Assess the lead quality and urgency.`;

    return this.generateDecision(email, systemPrompt);
  }
}
```

Create `src/agents/hrAgent.ts`:

```typescript
import { BaseAgent } from './baseAgent';
import { Email, AgentDecision } from '../types';

export class HRAgent extends BaseAgent {
  constructor() {
    super('HR');
  }

  async evaluate(email: Email): Promise<AgentDecision> {
    const systemPrompt = `You are an HR specialist. Evaluate if this email requires HR attention.

Look for:
- Job applications and resumes
- Interview scheduling
- Employee inquiries
- Policy questions
- Benefits or payroll issues
- Recruitment outreach

Determine if immediate HR attention is needed.`;

    return this.generateDecision(email, systemPrompt);
  }
}
```

Create `src/agents/spamFilterAgent.ts`:

```typescript
import { BaseAgent } from './baseAgent';
import { Email, AgentDecision } from '../types';

export class SpamFilterAgent extends BaseAgent {
  constructor() {
    super('SpamFilter');
  }

  async evaluate(email: Email): Promise<AgentDecision> {
    const systemPrompt = `You are a Spam Filter specialist. Evaluate if this email is spam or low-priority.

Look for:
- Marketing emails from unknown senders
- Phishing attempts
- Automated newsletters unrelated to business
- Suspicious links or attachments
- Generic mass-sent content
- Irrelevant promotional content

Be conservative - when in doubt, don't mark as spam.`;

    return this.generateDecision(email, systemPrompt);
  }
}
```

### Step 5: Implement the Supervisor Agent

Create `src/agents/supervisorAgent.ts`:

```typescript
import { Email, TriageResult, AgentDecision } from '../types';
import { CustomerSupportAgent } from './customerSupportAgent';
import { SalesAgent } from './salesAgent';
import { HRAgent } from './hrAgent';
import { SpamFilterAgent } from './spamFilterAgent';

export class SupervisorAgent {
  private customerSupportAgent: CustomerSupportAgent;
  private salesAgent: SalesAgent;
  private hrAgent: HRAgent;
  private spamFilterAgent: SpamFilterAgent;

  constructor() {
    this.customerSupportAgent = new CustomerSupportAgent();
    this.salesAgent = new SalesAgent();
    this.hrAgent = new HRAgent();
    this.spamFilterAgent = new SpamFilterAgent();
  }

  async triageEmail(email: Email): Promise<TriageResult> {
    // First, check if it's spam (quick elimination)
    const spamDecision = await this.spamFilterAgent.evaluate(email);
    if (spamDecision.shouldHandle && spamDecision.confidence > 70) {
      return this.createTriageResult(email, 'spam', 'low', 'SpamFilter', spamDecision);
    }

    // Run all specialist agents in parallel
    const [supportDecision, salesDecision, hrDecision] = await Promise.all([
      this.customerSupportAgent.evaluate(email),
      this.salesAgent.evaluate(email),
      this.hrAgent.evaluate(email)
    ]);

    // Determine the best agent based on confidence scores
    const decisions = [
      { agent: 'CustomerSupport', decision: supportDecision },
      { agent: 'Sales', decision: salesDecision },
      { agent: 'HR', decision: hrDecision }
    ];

    // Filter agents that want to handle the email
    const interestedAgents = decisions.filter(d => d.decision.shouldHandle);

    if (interestedAgents.length === 0) {
      // No agent wants to handle - default to manual review
      return this.createTriageResult(email, 'unclassified', 'medium', 'Manual', {
        shouldHandle: true,
        confidence: 0,
        reasoning: 'No agent could confidently categorize this email',
        escalate: true
      });
    }

    // Select the agent with highest confidence
    const selectedAgent = interestedAgents.reduce((prev, current) => 
      current.decision.confidence > prev.decision.confidence ? current : prev
    );

    const priority = this.determinePriority(selectedAgent.decision);
    const category = this.determineCategory(selectedAgent.agent, selectedAgent.decision);

    return this.createTriageResult(email, category, priority, selectedAgent.agent, selectedAgent.decision);
  }

  private createTriageResult(
    email: Email, 
    category: string, 
    priority: 'low' | 'medium' | 'high' | 'urgent',
    assignedAgent: string, 
    decision: AgentDecision
  ): TriageResult {
    return {
      emailId: email.id,
      category,
      priority,
      assignedAgent,
      summary: decision.reasoning,
      suggestedActions: decision.suggestedActions || [],
      requiresHumanReview: decision.escalate || false
    };
  }

  private determinePriority(decision: AgentDecision): 'low' | 'medium' | 'high' | 'urgent' {
    if (decision.escalate) return 'urgent';
    if (decision.confidence > 80) return 'high';
    if (decision.confidence > 60) return 'medium';
    return 'low';
  }

  private determineCategory(agent: string, decision: AgentDecision): string {
    const baseCategories = {
      'CustomerSupport': 'support',
      'Sales': 'sales',
      'HR': 'hr',
      'SpamFilter': 'spam'
    };

    return baseCategories[agent] || 'unclassified';
  }
}
```

### Step 6: Create the Main Application

Create `src/emailTriageSystem.ts`:

```typescript
import { SupervisorAgent } from './agents/supervisorAgent';
import { Email, TriageResult } from './types';

export class EmailTriageSystem {
  private supervisor: SupervisorAgent;

  constructor() {
    this.supervisor = new SupervisorAgent();
  }

  async processEmail(email: Email): Promise<TriageResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.supervisor.triageEmail(email);
      
      // Log metrics for monitoring
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        emailId: email.id,
        assignedAgent: result.assignedAgent,
        priority: result.priority,
        processingTime: Date.now() - startTime,
        category: result.category
      }));

      return result;
    } catch (error) {
      console.error('Error processing email:', error);
      throw error;
    }
  }

  async processBatch(emails: Email[]): Promise<TriageResult[]> {
    return Promise.all(emails.map(email => this.processEmail(email)));
  }
}
```

### Step 7: Example Usage

Create `src/example.ts`:

```typescript
import { EmailTriageSystem } from './emailTriageSystem';
import { Email } from './types';

async function main() {
  const triageSystem = new EmailTriageSystem();

  // Example emails
  const emails: Email[] = [
    {
      id: '1',
      from: 'customer@example.com',
      to: 'support@company.com',
      subject: 'Cannot login to my account',
      body: 'I keep getting error 500 when trying to log in. This has been happening for 2 days.',
      timestamp: new Date()
    },
    {
      id: '2',
      from: 'prospect@bigcorp.com',
      to: 'sales@company.com',
      subject: 'Enterprise pricing inquiry',
      body: 'We are interested in your enterprise plan for 500+ users. Could you send pricing?',
      timestamp: new Date()
    },
    {
      id: '3',
      from: 'candidate@email.com',
      to: 'jobs@company.com',
      subject: 'Application for Software Engineer Position',
      body: 'Please find attached my resume for the senior software engineer role.',
      timestamp: new Date()
    }
  ];

  // Process emails
  for (const email of emails) {
    const result = await triageSystem.processEmail(email);
    console.log(`\nEmail ${email.id}:`);
    console.log(`Category: ${result.category}`);
    console.log(`Priority: ${result.priority}`);
    console.log(`Assigned to: ${result.assignedAgent}`);
    console.log(`Summary: ${result.summary}`);
    console.log(`Actions: ${result.suggestedActions.join(', ')}`);
  }
}

main().catch(console.error);
```

## Benefits Over Single-Agent Systems

### Improved Accuracy
Specialist agents consistently outperform generalist agents in their domains. A dedicated Sales Agent better identifies qualified leads than a general-purpose agent trying to handle all email types.

### Better Scalability  
Adding new capabilities doesn't require retraining existing agents. You simply add new specialists to the system.

### Fault Tolerance
If one agent fails or performs poorly, others can continue working. The system degrades gracefully rather than failing completely.

### Explainable Decisions
Each agent provides reasoning for its decisions, making the overall system more transparent and debuggable.

## Performance Considerations

### Parallel Processing
Running agent evaluations in parallel significantly reduces response time:

```typescript
// Parallel evaluation reduces latency
const [supportDecision, salesDecision, hrDecision] = await Promise.all([
  this.customerSupportAgent.evaluate(email),
  this.salesAgent.evaluate(email), 
  this.hrAgent.evaluate(email)
]);
```

### Cost Optimization
The spam filter runs first to quickly eliminate low-value emails before expensive LLM evaluations:

```typescript
// Quick spam check before expensive evaluations
const spamDecision = await this.spamFilterAgent.evaluate(email);
if (spamDecision.shouldHandle && spamDecision.confidence > 70) {
  return this.filterAsSpam(email);
}
```

### Caching and Memoization
Similar emails can reuse previous evaluations to reduce API calls and improve response times.

## Extending the System

### Adding New Agents

To add a Legal Agent:

```typescript
export class LegalAgent extends BaseAgent {
  constructor() {
    super('Legal');
  }

  async evaluate(email: Email): Promise<AgentDecision> {
    const systemPrompt = `You are a Legal specialist. Evaluate if this email requires legal attention.

Look for:
- Contract discussions and negotiations
- Legal notices and compliance issues
- Intellectual property matters
- Privacy and data protection concerns
- Litigation or dispute-related content
- Regulatory compliance questions

Assess urgency and legal risk level.`;

    return this.generateDecision(email, systemPrompt);
  }
}
```

Then add it to the supervisor:

```typescript
constructor() {
  // ... existing agents
  this.legalAgent = new LegalAgent();
}

async triageEmail(email: Email): Promise<TriageResult> {
  // Add to parallel evaluation
  const [supportDecision, salesDecision, hrDecision, legalDecision] = await Promise.all([
    this.customerSupportAgent.evaluate(email),
    this.salesAgent.evaluate(email),
    this.hrAgent.evaluate(email),
    this.legalAgent.evaluate(email)
  ]);
}
```

### Custom Routing Logic

Implement domain-specific routing rules:

```typescript
private async makeRoutingDecision(email: Email, decisions: any[]): Promise<TriageResult> {
  // Custom business logic
  if (this.isVIPCustomer(email.from)) {
    return this.routeToVIPSupport(email);
  }
  
  if (this.isHighValueProspect(email)) {
    return this.routeToSeniorSales(email);
  }
  
  // Standard routing logic...
  return this.standardRouting(decisions);
}

private isVIPCustomer(emailAddress: string): boolean {
  const vipDomains = ['bigclient.com', 'enterprise.com'];
  return vipDomains.some(domain => emailAddress.includes(domain));
}

private isHighValueProspect(email: Email): boolean {
  const indicators = ['enterprise', 'bulk', '1000+', 'enterprise pricing'];
  return indicators.some(indicator => 
    email.subject.toLowerCase().includes(indicator) || 
    email.body.toLowerCase().includes(indicator)
  );
}
```

### Integration with External Systems

Connect to your existing tools:

```typescript
async triageEmail(email: Email): Promise<TriageResult> {
  const result = await this.supervisor.triageEmail(email);
  
  // Create ticket in helpdesk system
  if (result.assignedAgent === 'CustomerSupport') {
    await this.createSupportTicket(email, result);
  }
  
  // Add lead to CRM
  if (result.assignedAgent === 'Sales') {
    await this.createCRMLead(email, result);
  }
  
  // Notify HR system
  if (result.assignedAgent === 'HR') {
    await this.notifyHRSystem(email, result);
  }
  
  return result;
}

private async createSupportTicket(email: Email, result: TriageResult): Promise<void> {
  // Integration with helpdesk API
  const ticket = {
    subject: email.subject,
    description: email.body,
    priority: result.priority,
    customerEmail: email.from,
    category: result.category
  };
  
  // await helpdeskAPI.createTicket(ticket);
  console.log('Support ticket created:', ticket);
}

private async createCRMLead(email: Email, result: TriageResult): Promise<void> {
  // Integration with CRM API
  const lead = {
    email: email.from,
    source: 'email',
    priority: result.priority,
    notes: result.summary,
    suggestedActions: result.suggestedActions
  };
  
  // await crmAPI.createLead(lead);
  console.log('CRM lead created:', lead);
}
```

## Other Use Cases for Multi-Agent Systems

Multi-agent architectures excel in many domains beyond email triage:

### Content Moderation
- **Toxicity Agent**: Detects harmful language and harassment
- **Spam Agent**: Identifies promotional and irrelevant content  
- **Policy Agent**: Checks against community guidelines
- **Context Agent**: Analyzes cultural and situational appropriateness

### Financial Analysis
- **Risk Agent**: Assesses investment and credit risks
- **Fraud Agent**: Detects suspicious transactions and patterns
- **Compliance Agent**: Ensures regulatory adherence
- **Market Agent**: Analyzes trends and opportunities

### Healthcare Triage
- **Urgency Agent**: Determines medical priority levels
- **Specialty Agent**: Routes to appropriate medical departments
- **Symptom Agent**: Analyzes patient-reported symptoms
- **Protocol Agent**: Suggests care pathways and treatments

### Legal Document Review
- **Contract Agent**: Analyzes agreements and terms
- **Risk Agent**: Identifies legal liabilities and concerns
- **Compliance Agent**: Checks regulatory requirements
- **Classification Agent**: Categorizes by practice area and urgency

## Testing and Validation

### Unit Testing Agents

Test individual agent decisions:

```typescript
describe('CustomerSupportAgent', () => {
  let agent: CustomerSupportAgent;

  beforeEach(() => {
    agent = new CustomerSupportAgent();
  });

  it('should identify technical issues', async () => {
    const email: Email = {
      id: 'test-1',
      from: 'user@example.com',
      to: 'support@company.com',
      subject: 'Login Error - Cannot Access Account',
      body: 'Getting error code 500 when trying to log in. This started yesterday.',
      timestamp: new Date()
    };
    
    const decision = await agent.evaluate(email);
    expect(decision.shouldHandle).toBe(true);
    expect(decision.confidence).toBeGreaterThan(80);
    expect(decision.reasoning).toContain('technical');
  });

  it('should not handle sales inquiries', async () => {
    const email: Email = {
      id: 'test-2',
      from: 'prospect@company.com',
      to: 'contact@company.com',
      subject: 'Pricing Information Request',
      body: 'Could you send me pricing for your premium plan?',
      timestamp: new Date()
    };
    
    const decision = await agent.evaluate(email);
    expect(decision.shouldHandle).toBe(false);
  });
});
```

### Integration Testing

Test the complete triage flow:

```typescript
describe('Email Triage System', () => {
  let triageSystem: EmailTriageSystem;

  beforeEach(() => {
    triageSystem = new EmailTriageSystem();
  });

  it('should route support emails correctly', async () => {
    const supportEmail: Email = {
      id: 'integration-1',
      from: 'customer@example.com',
      to: 'help@company.com',
      subject: 'Bug Report - Data Not Saving',
      body: 'When I click save, nothing happens. Please help!',
      timestamp: new Date()
    };

    const result = await triageSystem.processEmail(supportEmail);
    expect(result.assignedAgent).toBe('CustomerSupport');
    expect(result.priority).toBeOneOf(['medium', 'high']);
    expect(result.category).toBe('support');
  });

  it('should handle batch processing', async () => {
    const emails: Email[] = [
      createTestEmail('1', 'support@company.com', 'Bug report'),
      createTestEmail('2', 'sales@company.com', 'Pricing inquiry'),
      createTestEmail('3', 'hr@company.com', 'Job application')
    ];

    const results = await triageSystem.processBatch(emails);
    expect(results).toHaveLength(3);
    expect(results.every(r => r.assignedAgent)).toBe(true);
  });
});

function createTestEmail(id: string, to: string, subject: string): Email {
  return {
    id,
    from: `test${id}@example.com`,
    to,
    subject,
    body: `Test email body for ${subject}`,
    timestamp: new Date()
  };
}
```

### A/B Testing

Compare multi-agent performance against single-agent systems:

```typescript
async function comparePerformance() {
  const testEmails = await loadTestDataset();
  
  // Run both systems
  const multiAgentResults = await Promise.all(
    testEmails.map(email => multiAgentSupervisor.triageEmail(email))
  );
  
  const singleAgentResults = await Promise.all(
    testEmails.map(email => singleAgent.triageEmail(email))
  );

  // Calculate metrics
  const multiAgentAccuracy = calculateAccuracy(multiAgentResults, testEmails);
  const singleAgentAccuracy = calculateAccuracy(singleAgentResults, testEmails);

  console.log('Performance Comparison:');
  console.log(`Multi-Agent Accuracy: ${multiAgentAccuracy}%`);
  console.log(`Single-Agent Accuracy: ${singleAgentAccuracy}%`);
  
  // Track costs and latency
  await recordMetrics({
    multiAgent: {
      accuracy: multiAgentAccuracy,
      avgLatency: calculateAverageLatency(multiAgentResults),
      cost: calculateCost(multiAgentResults)
    },
    singleAgent: {
      accuracy: singleAgentAccuracy,
      avgLatency: calculateAverageLatency(singleAgentResults),
      cost: calculateCost(singleAgentResults)
    }
  });
}
```

## Production Deployment

### Environment Configuration

Use environment variables for different deployment stages:

```typescript
// src/config.ts
export const config = {
  llm: {
    model: process.env.NODE_ENV === 'production' ? 'gpt-4' : 'gpt-4o-mini',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.1'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    timeout: parseInt(process.env.LLM_TIMEOUT || '30000')
  },
  
  agents: {
    enableParallelProcessing: process.env.ENABLE_PARALLEL === 'true',
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7'),
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT || '10')
  },
  
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMetrics: process.env.ENABLE_METRICS === 'true'
  }
};
```

### Monitoring and Alerting

Track system performance:

```typescript
class MetricsCollector {
  private metrics: Map<string, any[]> = new Map();

  recordTriageMetrics(email: Email, result: TriageResult, processingTime: number) {
    const metric = {
      timestamp: new Date().toISOString(),
      emailId: email.id,
      assignedAgent: result.assignedAgent,
      confidence: result.confidence,
      processingTime,
      priority: result.priority,
      category: result.category
    };

    console.log(JSON.stringify(metric));
    
    // Store for analysis
    if (!this.metrics.has('triageResults')) {
      this.metrics.set('triageResults', []);
    }
    this.metrics.get('triageResults')!.push(metric);

    // Alert on anomalies
    if (processingTime > 10000) {
      this.sendAlert('HIGH_LATENCY', `Processing time: ${processingTime}ms`);
    }
  }

  private sendAlert(type: string, message: string) {
    console.error(`ALERT [${type}]: ${message}`);
    // Integration with alerting system
  }

  getMetricsSummary() {
    const results = this.metrics.get('triageResults') || [];
    return {
      totalProcessed: results.length,
      averageProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length,
      agentDistribution: this.calculateAgentDistribution(results),
      priorityDistribution: this.calculatePriorityDistribution(results)
    };
  }

  private calculateAgentDistribution(results: any[]) {
    return results.reduce((dist, result) => {
      dist[result.assignedAgent] = (dist[result.assignedAgent] || 0) + 1;
      return dist;
    }, {});
  }

  private calculatePriorityDistribution(results: any[]) {
    return results.reduce((dist, result) => {
      dist[result.priority] = (dist[result.priority] || 0) + 1;
      return dist;
    }, {});
  }
}
```

### Error Handling and Resilience

Implement robust error handling:

```typescript
export class ResilientBaseAgent extends BaseAgent {
  private retryCount = 0;
  private maxRetries = 3;

  async evaluate(email: Email): Promise<AgentDecision> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.performEvaluationWithTimeout(email);
      } catch (error) {
        console.error(`Attempt ${attempt} failed for ${this.name} agent:`, error);
        
        if (attempt === this.maxRetries) {
          // Final fallback
          return this.createFallbackDecision(error);
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    // TypeScript satisfaction - this won't be reached
    return this.createFallbackDecision(new Error('Max retries exceeded'));
  }

  private async performEvaluationWithTimeout(email: Email): Promise<AgentDecision> {
    return Promise.race([
      this.performEvaluation(email),
      this.createTimeoutPromise()
    ]);
  }

  private createTimeoutPromise(): Promise<AgentDecision> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Evaluation timeout')), 30000);
    });
  }

  private createFallbackDecision(error: Error): AgentDecision {
    return {
      shouldHandle: false,
      confidence: 0,
      reasoning: `Agent error (${error.message}) - requires manual review`,
      escalate: true,
      suggestedActions: ['Manual review required', 'Check system logs']
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Cost Optimization Strategies

### Intelligent Caching

Cache similar email patterns:

```typescript
class TriageCache {
  private cache = new Map<string, { result: AgentDecision; timestamp: number }>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  generateCacheKey(email: Email): string {
    // Create hash based on subject patterns and sender domain
    const domain = email.from.split('@')[1];
    const subjectPattern = email.subject.toLowerCase()
      .replace(/\d+/g, 'NUM')
      .replace(/[^\w\s]/g, '');
    
    return `${domain}:${subjectPattern}`;
  }

  get(key: string): AgentDecision | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  set(key: string, result: AgentDecision): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### Tiered Model Usage

Use cheaper models for initial filtering:

```typescript
class TieredEvaluationAgent extends BaseAgent {
  private quickClassifier: ChatOpenAI;
  private detailedAnalyzer: ChatOpenAI;

  constructor(name: string) {
    super(name);
    
    // Cheaper model for quick classification
    this.quickClassifier = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.1,
    });
    
    // More expensive model for detailed analysis
    this.detailedAnalyzer = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.1,
    });
  }

  async evaluate(email: Email): Promise<AgentDecision> {
    // Quick classification first
    const quickDecision = await this.quickClassification(email);
    
    // If confidence is high enough, use quick decision
    if (quickDecision.confidence > 85) {
      return quickDecision;
    }
    
    // Otherwise, use detailed analysis
    return this.detailedAnalysis(email);
  }

  private async quickClassification(email: Email): Promise<AgentDecision> {
    const prompt = `Quick classification: Is this email relevant to ${this.name}? 
    Email: ${email.subject} - ${email.body.substring(0, 200)}
    Respond with JSON: {shouldHandle: boolean, confidence: number}`;
    
    const response = await this.quickClassifier.invoke([{ role: 'user', content: prompt }]);
    return JSON.parse(response.content as string);
  }

  private async detailedAnalysis(email: Email): Promise<AgentDecision> {
    // Full detailed analysis with more expensive model
    return this.generateDecision(email, this.getDetailedPrompt());
  }

  protected abstract getDetailedPrompt(): string;
}
```

### Batch Processing

Process multiple emails together when possible:

```typescript
export class BatchTriageSystem extends EmailTriageSystem {
  async processBatchOptimized(emails: Email[]): Promise<TriageResult[]> {
    // Group similar emails for batch processing
    const batches = this.groupSimilarEmails(emails);
    
    // Process each batch with optimizations
    const results = await Promise.all(
      batches.map(batch => this.processBatchGroup(batch))
    );
    
    return results.flat();
  }

  private groupSimilarEmails(emails: Email[]): Email[][] {
    const groups = new Map<string, Email[]>();
    
    emails.forEach(email => {
      const pattern = this.extractPattern(email);
      if (!groups.has(pattern)) {
        groups.set(pattern, []);
      }
      groups.get(pattern)!.push(email);
    });
    
    return Array.from(groups.values());
  }

  private extractPattern(email: Email): string {
    const domain = email.from.split('@')[1];
    const hasAttachment = email.body.includes('attach');
    const isUrgent = /urgent|asap|immediate/i.test(email.subject + email.body);
    
    return `${domain}:${hasAttachment}:${isUrgent}`;
  }

  private async processBatchGroup(emails: Email[]): Promise<TriageResult[]> {
    if (emails.length === 1) {
      return [await this.processEmail(emails[0])];
    }

    // For similar emails, process first one fully, then apply pattern to others
    const [firstEmail, ...otherEmails] = emails;
    const firstResult = await this.processEmail(firstEmail);
    
    // Apply similar logic to other emails with adjustments
    const otherResults = await Promise.all(
      otherEmails.map(email => this.processEmailWithPattern(email, firstResult))
    );
    
    return [firstResult, ...otherResults];
  }

  private async processEmailWithPattern(email: Email, pattern: TriageResult): Promise<TriageResult> {
    // Use pattern as guidance but still validate
    if (this.isSimilarEnough(email, pattern)) {
      return {
        ...pattern,
        emailId: email.id,
        summary: `Similar to ${pattern.emailId}: ${pattern.summary}`
      };
    }
    
    // Fall back to full processing if not similar enough
    return this.processEmail(email);
  }

  private isSimilarEnough(email: Email, pattern: TriageResult): boolean {
    // Implement similarity logic
    const sameDomain = email.from.split('@')[1] === pattern.emailId.split('@')[1];
    const similarSubject = this.calculateSimilarity(email.subject, pattern.summary) > 0.7;
    
    return sameDomain && similarSubject;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    
    return intersection.length / Math.max(words1.length, words2.length);
  }
}
```

## Future Enhancements

### Machine Learning Integration

Train custom models on your email data:

```typescript
class CustomModelTrainer {
  async trainOrganizationModel(historicalData: Email[]): Promise<any> {
    // Prepare training data
    const trainingExamples = historicalData.map(email => ({
      input: `${email.subject}\n${email.body}`,
      output: email.category, // Assuming emails are pre-labeled
      features: this.extractFeatures(email)
    }));

    // Fine-tune base model with organization-specific data
    const customModel = await this.fineTuneModel({
      baseModel: 'gpt-4o-mini',
      trainingData: trainingExamples,
      hyperparameters: {
        learningRate: 0.0001,
        epochs: 3,
        batchSize: 16
      }
    });

    return customModel;
  }

  private extractFeatures(email: Email) {
    return {
      senderDomain: email.from.split('@')[1],
      hasAttachments: email.body.includes('attach'),
      wordCount: email.body.split(/\s+/).length,
      timeOfDay: email.timestamp.getHours(),
      dayOfWeek: email.timestamp.getDay(),
      containsNumbers: /\d/.test(email.subject + email.body),
      urgencyIndicators: this.countUrgencyWords(email.subject + email.body)
    };
  }

  private countUrgencyWords(text: string): number {
    const urgencyWords = ['urgent', 'asap', 'immediate', 'emergency', 'critical'];
    return urgencyWords.reduce((count, word) => 
      count + (text.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0
    );
  }

  private async fineTuneModel(config: any): Promise<any> {
    // Implementation would depend on your ML platform
    console.log('Training custom model with config:', config);
    // Return mock model for example
    return { modelId: 'custom-email-classifier-v1', version: '1.0' };
  }
}
```

### Workflow Automation

Trigger automated actions based on triage results:

```typescript
class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();

  constructor() {
    this.setupDefaultWorkflows();
  }

  async executeWorkflow(result: TriageResult, email: Email): Promise<void> {
    const workflowKey = `${result.category}-${result.priority}`;
    const workflow = this.workflows.get(workflowKey) || this.workflows.get('default');
    
    if (workflow) {
      await this.runWorkflow(workflow, result, email);
    }
  }

  private setupDefaultWorkflows() {
    // Urgent support workflow
    this.workflows.set('support-urgent', {
      steps: [
        { action: 'createTicket', priority: 'urgent' },
        { action: 'notifyOnCall', medium: 'sms' },
        { action: 'escalateToManager', delay: 300000 } // 5 minutes
      ]
    });

    // High-value sales lead workflow
    this.workflows.set('sales-high', {
      steps: [
        { action: 'createLead', source: 'email' },
        { action: 'assignToTopRep', criteria: 'revenue' },
        { action: 'scheduleFollowUp', delay: 3600000 } // 1 hour
      ]
    });

    // HR application workflow
    this.workflows.set('hr-medium', {
      steps: [
        { action: 'parseResume', extractData: true },
        { action: 'screenCandidate', automated: true },
        { action: 'scheduleInterview', conditional: 'passed_screening' }
      ]
    });
  }

  private async runWorkflow(workflow: WorkflowDefinition, result: TriageResult, email: Email) {
    for (const step of workflow.steps) {
      try {
        await this.executeStep(step, result, email);
        
        if (step.delay) {
          await this.scheduleDelayedStep(step, result, email, step.delay);
        }
      } catch (error) {
        console.error(`Workflow step failed:`, error);
        // Continue with other steps or implement retry logic
      }
    }
  }

  private async executeStep(step: WorkflowStep, result: TriageResult, email: Email) {
    switch (step.action) {
      case 'createTicket':
        await this.createSupportTicket(email, result, step.priority);
        break;
        
      case 'notifyOnCall':
        await this.notifyOnCallEngineer(result, step.medium);
        break;
        
      case 'createLead':
        await this.createCRMLead(email, result, step.source);
        break;
        
      case 'assignToTopRep':
        await this.assignToSalesRep(result, step.criteria);
        break;
        
      case 'scheduleFollowUp':
        await this.scheduleFollowUpCall(result);
        break;
        
      default:
        console.log(`Unknown workflow action: ${step.action}`);
    }
  }

  private async scheduleDelayedStep(
    step: WorkflowStep, 
    result: TriageResult, 
    email: Email, 
    delay: number
  ) {
    setTimeout(async () => {
      await this.executeStep(step, result, email);
    }, delay);
  }

  // Workflow action implementations
  private async createSupportTicket(email: Email, result: TriageResult, priority?: string) {
    console.log(`Creating ${priority || result.priority} priority support ticket`);
    // Implementation here
  }

  private async notifyOnCallEngineer(result: TriageResult, medium: string) {
    console.log(`Notifying on-call engineer via ${medium}`);
    // Implementation here
  }

  private async createCRMLead(email: Email, result: TriageResult, source: string) {
    console.log(`Creating CRM lead from ${source}`);
    // Implementation here
  }

  private async assignToSalesRep(result: TriageResult, criteria: string) {
    console.log(`Assigning to sales rep based on ${criteria}`);
    // Implementation here
  }

  private async scheduleFollowUpCall(result: TriageResult) {
    console.log('Scheduling follow-up call');
    // Implementation here
  }
}

interface WorkflowDefinition {
  steps: WorkflowStep[];
}

interface WorkflowStep {
  action: string;
  delay?: number;
  priority?: string;
  medium?: string;
  source?: string;
  criteria?: string;
  extractData?: boolean;
  automated?: boolean;
  conditional?: string;
}
```

### Continuous Learning

Implement feedback loops:

```typescript
class ContinuousLearningSystem {
  private feedbackStore: FeedbackData[] = [];
  private retrainingThreshold = 100; // Retrain after 100 feedback entries

  async recordFeedback(
    emailId: string, 
    prediction: TriageResult, 
    actualCategory: string, 
    userFeedback: string
  ) {
    const feedback: FeedbackData = {
      emailId,
      predictedCategory: prediction.category,
      predictedAgent: prediction.assignedAgent,
      actualCategory,
      userFeedback,
      timestamp: new Date(),
      confidence: prediction.confidence
    };

    this.feedbackStore.push(feedback);
    
    // Analyze feedback for immediate improvements
    await this.analyzeFeedback(feedback);
    
    // Check if retraining is needed
    if (await this.shouldRetrain()) {
      await this.triggerModelRetraining();
    }
  }

  private async analyzeFeedback(feedback: FeedbackData) {
    // Identify systematic errors
    const recentFeedback = this.getRecentFeedback(7); // Last 7 days
    const errorPatterns = this.identifyErrorPatterns(recentFeedback);
    
    if (errorPatterns.length > 0) {
      console.log('Error patterns detected:', errorPatterns);
      await this.adjustAgentThresholds(errorPatterns);
    }
  }

  private getRecentFeedback(days: number): FeedbackData[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.feedbackStore.filter(fb => fb.timestamp > cutoff);
  }

  private identifyErrorPatterns(feedback: FeedbackData[]): ErrorPattern[] {
    const patterns: ErrorPattern[] = [];
    
    // Group by predicted vs actual category
    const errorGroups = feedback
      .filter(fb => fb.predictedCategory !== fb.actualCategory)
      .reduce((groups, fb) => {
        const key = `${fb.predictedCategory}->${fb.actualCategory}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(fb);
        return groups;
      }, {} as Record<string, FeedbackData[]>);

    // Identify patterns with high frequency
    Object.entries(errorGroups).forEach(([key, errors]) => {
      if (errors.length >= 3) { // Pattern threshold
        patterns.push({
          type: 'misclassification',
          from: key.split('->')[0],
          to: key.split('->')[1],
          frequency: errors.length,
          avgConfidence: errors.reduce((sum, e) => sum + e.confidence, 0) / errors.length
        });
      }
    });

    return patterns;
  }

  private async adjustAgentThresholds(patterns: ErrorPattern[]) {
    for (const pattern of patterns) {
      if (pattern.type === 'misclassification' && pattern.avgConfidence > 80) {
        // High confidence but wrong - adjust agent sensitivity
        console.log(`Adjusting threshold for ${pattern.from} agent due to overconfidence`);
        await this.updateAgentConfiguration(pattern.from, {
          confidenceThreshold: pattern.avgConfidence + 5,
          reviewRequired: true
        });
      }
    }
  }

  private async shouldRetrain(): Promise<boolean> {
    const totalFeedback = this.feedbackStore.length;
    const errorRate = this.calculateErrorRate();
    
    return totalFeedback >= this.retrainingThreshold || errorRate > 0.15;
  }

  private calculateErrorRate(): number {
    const recent = this.getRecentFeedback(30); // Last 30 days
    if (recent.length === 0) return 0;
    
    const errors = recent.filter(fb => fb.predictedCategory !== fb.actualCategory);
    return errors.length / recent.length;
  }

  private async triggerModelRetraining() {
    console.log('Triggering model retraining with new feedback data');
    
    const trainingData = this.feedbackStore.map(fb => ({
      email: fb.emailId,
      correctCategory: fb.actualCategory,
      feedback: fb.userFeedback
    }));

    // Trigger retraining job
    await this.scheduleRetrainingJob(trainingData);
    
    // Clear processed feedback
    this.feedbackStore = [];
  }

  private async scheduleRetrainingJob(trainingData: any[]) {
    // Implementation would depend on your ML infrastructure
    console.log(`Scheduling retraining job with ${trainingData.length} examples`);
    
    // Example: Submit to ML training pipeline
    // await mlPipeline.submitTrainingJob({
    //   data: trainingData,
    //   model: 'email-triage-v2',
    //   priority: 'normal'
    // });
  }

  private async updateAgentConfiguration(agentName: string, updates: any) {
    console.log(`Updating ${agentName} configuration:`, updates);
    // Update agent configuration in database or config store
  }
}

interface FeedbackData {
  emailId: string;
  predictedCategory: string;
  predictedAgent: string;
  actualCategory: string;
  userFeedback: string;
  timestamp: Date;
  confidence: number;
}

interface ErrorPattern {
  type: string;
  from: string;
  to: string;
  frequency: number;
  avgConfidence: number;
}
```

## Conclusion

Multi-agent systems provide a powerful framework for building sophisticated AI applications. By breaking complex problems into specialized components, we achieve better accuracy, maintainability, and scalability than single-agent approaches.

The email triage system demonstrates key multi-agent concepts:
- **Specialist agents** with focused expertise
- **Supervisor coordination** for decision-making  
- **Parallel processing** for efficiency
- **Conflict resolution** when multiple agents compete

Key takeaways from building this system:

1. **Specialization beats generalization** - focused agents consistently outperform general-purpose ones
2. **Parallel evaluation** dramatically improves response times
3. **Robust error handling** ensures system reliability
4. **Continuous learning** keeps the system improving over time
5. **Cost optimization** through caching and tiered models makes production deployment viable

This architecture scales well to other domains and can be extended with additional agents, custom routing logic, and external integrations. Whether you're building systems for content moderation, financial analysis, healthcare triage, or legal document review, the multi-agent approach provides a solid foundation for complex AI applications.

## From Email Triage to Incident Analysis: The Power of Specialized AI

While building custom multi-agent systems like this email triage example provides valuable learning and flexibility, many organizations struggle with another critical challenge: incident detection and analysis.

**[Uptime Agent](https://uptime-agent.io/)** specializes in solving the incident analysis problem with AI. Instead of chasing incidents manually, Uptime Agent automatically catches and analyzes them for you, providing intelligent insights that help teams respond faster and more effectively.

The multi-agent architecture principles we've explored in this email triage system - having specialized agents work together to solve complex problems - apply directly to incident management. Just as our email triage system routes communications to the right specialists, effective incident response requires intelligent routing, analysis, and coordination.

Whether you're building multi-agent systems for email triage, content moderation, or other automation tasks, the core concept remains the same: **specialized AI agents working together deliver better results than any single general-purpose solution**.

**Ready to see how AI can transform your incident response?** [Discover how Uptime Agent](https://uptime-agent.io/) can help you stop chasing incidents and catch them automatically.

---

*This example demonstrates the fundamental concepts of multi-agent systems using LangChain.js and LangGraph. The complete code is available in the GitHub repository accompanying this blog post.*
