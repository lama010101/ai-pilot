
import { COST_CONSTANTS, MISSION_COMPLIANCE_KEYWORDS } from '../supabaseTypes';

// Generate a unique ID
export function generateId(): string {
  // Simple UUID-like generation for mock data
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Calculate cost for a task
export function calculateTaskCost(command: string): number {
  // Simple cost calculation based on input length
  const { BASE_COST, TOKEN_RATE, AVERAGE_TOKENS_PER_CHAR } = COST_CONSTANTS;
  const estimatedTokens = command.length * AVERAGE_TOKENS_PER_CHAR;
  return BASE_COST + (estimatedTokens * TOKEN_RATE);
}

// Calculate mission compliance score
export function calculateMissionScore(text: string): number {
  if (!text) return 0;
  
  const lowercaseText = text.toLowerCase();
  let score = 50; // Start at neutral
  
  // Check for peace keywords
  const peaceMatches = MISSION_COMPLIANCE_KEYWORDS.peace.filter(
    keyword => lowercaseText.includes(keyword)
  ).length;
  
  // Check for autonomy keywords
  const autonomyMatches = MISSION_COMPLIANCE_KEYWORDS.autonomy.filter(
    keyword => lowercaseText.includes(keyword)
  ).length;
  
  // Check for improvement keywords
  const improvementMatches = MISSION_COMPLIANCE_KEYWORDS.improvement.filter(
    keyword => lowercaseText.includes(keyword)
  ).length;
  
  // Calculate final score (each category can add up to ~16 points)
  score += peaceMatches * 5;
  score += autonomyMatches * 5;
  score += improvementMatches * 5;
  
  // Cap at 100
  return Math.min(Math.max(score, 0), 100);
}
