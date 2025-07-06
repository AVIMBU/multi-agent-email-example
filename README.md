# Multi-Agent Email Triage System

A sophisticated email triage system built with LangChain.js and LangGraph that demonstrates multi-agent AI architecture. This system automatically categorizes, prioritizes, and routes incoming emails using specialized AI agents.

## 🏗️ Architecture

The system uses a **Supervisor Architecture** with the following components:

- **Supervisor Agent**: Orchestrates the triage process and makes final routing decisions
- **Customer Support Agent**: Handles technical issues and customer inquiries
- **Sales Agent**: Manages business inquiries and lead qualification
- **HR Agent**: Processes recruitment and employee-related emails  
- **Spam Filter Agent**: Identifies and filters low-priority communications

## 🚀 Features

- **Parallel Agent Evaluation**: Multiple agents analyze emails simultaneously for efficiency
- **Confidence-Based Routing**: Intelligent routing based on agent confidence scores
- **Conflict Resolution**: Supervisor LLM resolves conflicts when multiple agents compete
- **Priority Escalation**: High-priority items automatically flagged for human review
- **Extensible Design**: Easy to add new specialist agents

## 📋 Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- TypeScript knowledge (helpful but not required)

## 🛠️ Installation

1. **Clone or download this project**
   ```bash
   git clone <repository-url>
   cd multi-agent-email-example
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## 🎯 Usage

### Quick Demo (Recommended for Testing)

For a quick demonstration without LLM dependencies:

```bash
npm run demo
```

This runs a simplified version using rule-based logic that demonstrates the multi-agent concept without requiring API keys.

### Full LangChain.js Version

For the complete AI-powered version:

1. **Set up your OpenAI API key**:
   ```bash
   cp .env.example .env
   # Edit .env and add: OPENAI_API_KEY=your_key_here
   ```

2. **Run the full version**:
   ```bash
   npm run dev
   ```

### Build (Optional)

```bash
npm run build
npm start
```

**Note**: The TypeScript build may require significant memory due to LangChain.js type complexity. If you encounter memory issues, use the demo version or increase Node.js memory with `NODE_OPTIONS='--max-old-space-size=8192'`.

```
🚀 Starting Multi-Agent Email Triage System
==============================================

📧 Processing 6 sample emails...

📨 Email 1/6
From: sarah.chen@techcorp.com
Subject: Critical Payment Processing Issue - Urgent
Preview: Hi, our payment gateway has been down for the past 2 hours...
──────────────────────────────────────────────────

🎯 Supervisor: Starting triage for email "Critical Payment Processing Issue - Urgent"
📧 Checking for spam...
🔍 Evaluating with specialist agents...
📊 Agents willing to handle: CustomerSupport(95%)

✅ TRIAGE RESULT:
   Category: CustomerSupport
   Priority: URGENT
   Assigned to: CustomerSupport
   Summary: Critical payment system outage requiring immediate technical attention
   Actions: Escalate to technical team immediately, Create urgent support ticket
   ⚠️  Requires human review
```

## 📁 Project Structure

```
src/
├── agents/                 # Specialist agent implementations
│   ├── customerSupportAgent.ts
│   ├── salesAgent.ts
│   ├── spamFilterAgent.ts
│   ├── hrAgent.ts
│   └── supervisorAgent.ts  # Main orchestrator
├── types.ts               # TypeScript type definitions
├── sampleEmails.ts        # Test email data
└── index.ts              # Main application entry point
```

## 🧠 How It Works

1. **Email Input**: System receives an email to triage

2. **Spam Filtering**: Quick spam check to filter obvious low-priority emails

3. **Parallel Evaluation**: Specialist agents evaluate the email simultaneously:
   - Customer Support Agent checks for technical issues
   - Sales Agent looks for business opportunities  
   - HR Agent identifies recruitment/employee matters

4. **Decision Making**: Supervisor agent:
   - Collects all agent evaluations
   - Routes to highest-confidence agent if clear winner
   - Uses LLM reasoning to resolve conflicts if multiple agents compete

5. **Result**: Email gets categorized, prioritized, and routed with suggested actions

## 🔧 Customization

### Adding New Agents

1. Create a new agent class implementing the evaluation interface:

```typescript
export class LegalAgent {
  async evaluate(email: Email): Promise<AgentDecision> {
    // Agent-specific logic here
  }
}
```

2. Add to supervisor in `supervisorAgent.ts`:

```typescript
constructor() {
  // ... existing agents
  this.legalAgent = new LegalAgent();
}
```

3. Include in parallel evaluation:

```typescript
const legalDecision = await this.legalAgent.evaluate(email);
```

### Modifying Email Categories

Update the categories in `types.ts` and adjust agent logic accordingly.

### Changing LLM Models

Modify the model configuration in agent constructors:

```typescript
this.llm = new ChatOpenAI({
  model: 'gpt-4o',  // or 'gpt-4', 'gpt-3.5-turbo', etc.
  temperature: 0.1,
});
```

## 📊 Sample Results

The system processes various email types:

| Email Type | Assigned Agent | Priority | Confidence |
|------------|---------------|----------|------------|
| Payment gateway down | Customer Support | Urgent | 95% |
| Enterprise pricing inquiry | Sales | High | 88% |
| Newsletter signup | Spam Filter | Low | 92% |
| Resume submission | HR | Medium | 85% |
| Login issues | Customer Support | Medium | 78% |

## 🧪 Testing

Run with different email samples by modifying `sampleEmails.ts`:

```typescript
export const sampleEmails: Email[] = [
  {
    id: 'test-001',
    from: 'customer@example.com',
    to: 'support@company.com', 
    subject: 'Your Custom Subject',
    body: 'Your email content here...',
    timestamp: new Date()
  }
];
```

## 🔄 Integration Options

### With Email Providers
- Gmail API integration
- Outlook/Exchange webhooks
- IMAP/POP3 polling

### With Business Systems  
- CRM systems (Salesforce, HubSpot)
- Helpdesk platforms (Zendesk, ServiceNow)
- Slack/Teams notifications

### Example Integration

```typescript
async triageEmail(email: Email): Promise<TriageResult> {
  const result = await this.supervisor.triageEmail(email);
  
  // Auto-create tickets
  if (result.assignedAgent === 'CustomerSupport') {
    await this.createSupportTicket(email, result);
  }
  
  // Add leads to CRM
  if (result.assignedAgent === 'Sales') {
    await this.createCRMLead(email, result);
  }
  
  return result;
}
```

## ⚡ Performance Tips

- **Caching**: Cache similar email evaluations to reduce API calls
- **Batching**: Process multiple emails together when possible  
- **Model Selection**: Use cheaper models (gpt-4o-mini) for development/testing
- **Parallel Processing**: Agents evaluate emails simultaneously for speed

## 🚨 Error Handling

The system includes robust error handling:

- **Agent Failures**: Individual agent errors don't crash the system
- **API Rate Limits**: Automatic retry logic with exponential backoff
- **Fallback Routing**: Unknown emails get routed to "General" category
- **Graceful Degradation**: System continues operating even if some agents fail

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-agent`
3. Commit changes: `git commit -am 'Add legal agent'`
4. Push to branch: `git push origin feature/new-agent`
5. Submit a pull request

## 📚 Learn More

- [Blog Post: Building Multi-Agent Systems](./blog-post.md) - Comprehensive guide
- [LangChain.js Documentation](https://js.langchain.com/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Multi-Agent System Concepts](https://www.ibm.com/think/topics/multiagent-system)

## 🆘 Support

- Create an issue for bugs or feature requests
- Check the blog post for detailed explanations
- Review the code comments for implementation details

---

**Built with ❤️ using LangChain.js and LangGraph**


## 🛠️ Troubleshooting

### Build Issues

If you encounter memory errors during `npm run build`:

1. **Use the demo version** (recommended for testing):
   ```bash
   npm run demo
   ```

2. **Increase Node.js memory**:
   ```bash
   NODE_OPTIONS='--max-old-space-size=8192' npm run build
   ```

3. **Skip TypeScript build** and run directly:
   ```bash
   npm run dev  # for full AI version
   npm run demo # for simplified version
   ```

### Missing Dependencies

If you get import errors:
```bash
npm install
```

### API Key Issues

Make sure your `.env` file contains:
```
OPENAI_API_KEY=your_actual_api_key_here
```

For the demo version, no API key is required.

### Performance Tips

- Use `npm run demo` for quick testing without LLM calls
- The full AI version (`npm run dev`) requires internet connection and API usage
- Consider using `gpt-4o-mini` model for faster/cheaper responses during development

