import { ChatOpenAI } from '@langchain/openai';
import { Email, AgentDecision } from '../types';

/**
 * HR Agent - Specializes in handling HR-related communications,
 * recruitment inquiries, employee matters, and internal communications
 */
export class HRAgent {
  private llm: ChatOpenAI;
  private name = 'HR';

  constructor() {
    this.llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.1,
    });
  }
  /**
   * Evaluate if this agent should handle the email
   */
  async evaluate(email: Email): Promise<AgentDecision> {
    const prompt = `
You are an HR Agent specializing in handling HR-related communications, recruitment inquiries, employee matters, and internal communications.

Analyze this email and determine if it should be handled by the HR team:

FROM: ${email.from}
SUBJECT: ${email.subject}
BODY: ${email.body}

Consider these factors:
1. Is this related to recruitment, hiring, or candidate inquiries?
2. Does it involve employee relations or internal communications?
3. Is it about benefits, payroll, or company policies?
4. Should HR be involved in this communication?

Respond with your analysis in this format:
SHOULD_HANDLE: true/false
CONFIDENCE: 0-100
REASONING: Brief explanation
SUGGESTED_ACTIONS: List of recommended actions
ESCALATE: true/false (if requires senior HR attention)
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
      console.error('Error in HRAgent evaluation:', error);
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
