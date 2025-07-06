/**
 * Type definitions for the Multi-Agent Email Triage System
 */

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

export interface EmailTriageState {
  email: Email;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  agentDecisions: Record<string, AgentDecision>;
  finalResult?: TriageResult;
  requiresEscalation: boolean;
}
