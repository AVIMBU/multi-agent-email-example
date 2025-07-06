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
```Analysis**: Risk assessment, fraud detection, and compliance monitoring
- **Healthcare Triage**: Route patient inquiries to appropriate medical specialists
- **Legal Document Review**: Categorize and route legal documents by practice area

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
export class LegalAgent {
  async evaluate(email: Email): Promise<AgentDecision> {
    // Look for legal keywords, contract discussions, 
    // compliance issues, etc.
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
  const legalDecision = await this.legalAgent.evaluate(email);
}
```

### Custom Routing Logic

Implement domain-specific routing rules:

```typescript
private async makeRoutingDecision(decisions: AgentDecisions): Promise<TriageResult> {
  // Custom business logic
  if (this.isVIPCustomer(email.from)) {
    return this.routeToVIPSupport();
  }
  
  if (this.isHighValueProspect(email)) {
    return this.routeToSeniorSales();
  }
  
  // Standard routing logic...
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
  
  return result;
}
```

## Testing and Validation

### Unit Testing Agents

Test individual agent decisions:

```typescript
describe('CustomerSupportAgent', () => {
  it('should identify technical issues', async () => {
    const email = {
      subject: 'Login Error - Cannot Access Account',
      body: 'Getting error code 500 when trying to log in',
      // ... other fields
    };
    
    const decision = await agent.evaluate(email);
    expect(decision.shouldHandle).toBe(true);
    expect(decision.confidence).toBeGreaterThan(80);
  });
});
```

### Integration Testing

Test the complete triage flow:

```typescript
describe('Email Triage System', () => {
  it('should route support emails correctly', async () => {
    const result = await supervisor.triageEmail(supportEmail);
    expect(result.assignedAgent).toBe('CustomerSupport');
    expect(result.priority).toBe('high');
  });
});
```

### A/B Testing

Compare multi-agent performance against single-agent systems:

```typescript
// Run parallel comparison
const multiAgentResult = await multiAgentSupervisor.triageEmail(email);
const singleAgentResult = await singleAgent.triageEmail(email);

// Measure accuracy, latency, cost
await this.recordMetrics({
  multiAgent: multiAgentResult,
  singleAgent: singleAgentResult,
  actualCategory: email.actualCategory // from human labeling
});
```

## Production Deployment

### Environment Configuration

Use environment variables for different deployment stages:

```typescript
const config = {
  model: process.env.NODE_ENV === 'production' ? 'gpt-4' : 'gpt-4o-mini',
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.1'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
};
```

### Monitoring and Alerting

Track system performance:

```typescript
// Log metrics for monitoring
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  emailId: email.id,
  assignedAgent: result.assignedAgent,
  confidence: result.confidence,
  processingTime: Date.now() - startTime,
  priority: result.priority
}));
```

### Error Handling

Implement robust error handling:

```typescript
async evaluate(email: Email): Promise<AgentDecision> {
  try {
    return await this.performEvaluation(email);
  } catch (error) {
    console.error(`Error in ${this.name} agent:`, error);
    
    // Fallback decision
    return {
      shouldHandle: false,
      confidence: 0,
      reasoning: 'Agent error - requires manual review',
      escalate: true
    };
  }
}
```

## Cost Optimization Strategies

### Intelligent Caching

Cache similar email patterns:

```typescript
private cache = new Map<string, AgentDecision>();

async evaluate(email: Email): Promise<AgentDecision> {
  const cacheKey = this.generateCacheKey(email);
  
  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey)!;
  }
  
  const decision = await this.performEvaluation(email);
  this.cache.set(cacheKey, decision);
  
  return decision;
}
```

### Tiered Model Usage

Use cheaper models for initial filtering:

```typescript
// Quick classification with cheaper model
const category = await this.quickClassifier.classify(email);

// Detailed analysis only for unclear cases
if (category.confidence < 0.8) {
  return await this.detailedAnalyzer.analyze(email);
}
```

### Batch Processing

Process multiple emails together when possible:

```typescript
async triageEmailBatch(emails: Email[]): Promise<TriageResult[]> {
  // Group similar emails
  const batches = this.groupSimilarEmails(emails);
  
  // Process each batch efficiently
  const results = await Promise.all(
    batches.map(batch => this.processBatch(batch))
  );
  
  return results.flat();
}
```

## Future Enhancements

### Machine Learning Integration

Train custom models on your email data:

```typescript
// Use organization-specific training data
const customModel = await this.trainCustomClassifier({
  trainingData: organizationEmailHistory,
  baseModel: 'gpt-4o-mini'
});
```

### Workflow Automation

Trigger automated actions based on triage results:

```typescript
async executeWorkflow(result: TriageResult): Promise<void> {
  switch (result.category) {
    case 'urgent-support':
      await this.createUrgentTicket(result);
      await this.notifyOnCallEngineer(result);
      break;
      
    case 'high-value-lead':
      await this.assignToTopSalesRep(result);
      await this.scheduleFollowUpCall(result);
      break;
  }
}
```

### Continuous Learning

Implement feedback loops:

```typescript
async recordFeedback(emailId: string, actualCategory: string, userFeedback: string) {
  // Store feedback for model improvement
  await this.feedbackStore.record({
    emailId,
    predictedCategory: this.getPrediction(emailId),
    actualCategory,
    userFeedback,
    timestamp: new Date()
  });
  
  // Trigger retraining if enough feedback accumulated
  if (await this.shouldRetrain()) {
    await this.triggerModelRetraining();
  }
}
```

## Conclusion

Multi-agent systems provide a powerful framework for building sophisticated AI applications. By breaking complex problems into specialized components, we achieve better accuracy, maintainability, and scalability than single-agent approaches.

The email triage system demonstrates key multi-agent concepts:
- **Specialist agents** with focused expertise
- **Supervisor coordination** for decision-making
- **Parallel processing** for efficiency
- **Conflict resolution** when multiple agents compete

This architecture scales well to other domains and can be extended with additional agents, custom routing logic, and external integrations.

## From Email Triage to Incident Analysis: The Power of Specialized AI

While building custom multi-agent systems like this email triage example provides valuable learning and flexibility, many organizations struggle with another critical challenge: incident detection and analysis.

**[Uptime Agent](https://uptime-agent.io/)** specializes in solving the incident analysis problem with AI. Instead of chasing incidents manually, Uptime Agent automatically catches and analyzes them for you, providing intelligent insights that help teams respond faster and more effectively.

The multi-agent architecture principles we've explored in this email triage system - having specialized agents work together to solve complex problems - apply directly to incident management. Just as our email triage system routes communications to the right specialists, effective incident response requires intelligent routing, analysis, and coordination.

Whether you're building multi-agent systems for email triage, content moderation, or other automation tasks, the core concept remains the same: **specialized AI agents working together deliver better results than any single general-purpose solution**.

**Ready to see how AI can transform your incident response?** [Discover how Uptime Agent](https://uptime-agent.io/) can help you stop chasing incidents and catch them automatically.

---

*This example demonstrates the fundamental concepts of multi-agent systems using LangChain.js and LangGraph. The complete code is available in the GitHub repository accompanying this blog post.*

