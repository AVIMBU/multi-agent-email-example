import { ChatOpenAI } from '@langchain/openai';
import { Email, AgentDecision } from '../types';

/**
 * Spam Filter Agent - Specializes in identifying and filtering out
 * spam, newsletters, promotional emails, and low-priority communications
 */
export class SpamFilterAgent {
  private llm: ChatOpenAI;
  private name = 'SpamFilter';

  constructor() {
    this.llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.1,
    });
  }
  /**
   * Evaluate if this agent should handle the email (filter it out)
   */
  async evaluate(email: Email): Promise<AgentDecision> {
    const prompt = `
You are a Spam Filter Agent specializing in identifying and filtering out spam, newsletters, promotional emails, and low-priority communications.

Analyze this email and determine if it should be filtered out as spam/low-priority:

FROM: ${email.from}
SUBJECT: ${email.subject}
BODY: ${email.body}

Consider these factors:
1. Is this spam, newsletter, or promotional content?
2. Is this automated or mass-sent communication?
3. Does it lack business value or personal relevance?
4. Should it be filtered to reduce noise?

Respond with your analysis in this format:
SHOULD_HANDLE: true/false (true if should be filtered out)
CONFIDENCE: 0-100
REASONING: Brief explanation
SUGGESTED_ACTIONS: List of recommended actions
ESCALATE: false (spam filter rarely escalates)
`;

    try {
      const response = await this.llm.invoke(prompt);
      const content = response.content as string;
      
      // Parse the response
      const shouldHandle = content.includes('SHOULD_HANDLE: true');
      const confidenceMatch = content.match(/CONFIDENCE: (\d+)/);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;      
      const reasoningMatch = content.match(/REASONING: (.+?)(?=\n|$)/);
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Analysis completed';
      
      const escalateMatch = content.match(/ESCALATE: (true|false)/);
      const escalate = escalateMatch ? escalateMatch[1] === 'true' : false;
      
      // Extract suggested actions
      const actionsMatch = content.match(/SUGGESTED_ACTIONS: (.+?)(?=\nESCALATE|$)/s);
      const suggestedActions = actionsMatch ? 
        actionsMatch[1].split('\n').map(action => action.trim()).filter(action => action.length > 0) : 
        [];

      return {
        shouldHandle,
        confidence,
        reasoning,
        suggestedActions,
        escalate
      };
    } catch (error) {
      console.error('Error in SpamFilterAgent evaluation:', error);
      return {
        shouldHandle: false,
        confidence: 0,
        reasoning: 'Error occurred during evaluation',
        escalate: false
      };
    }
  }

  getName(): string {
    return this.name;
  }
}
