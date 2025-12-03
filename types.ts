export enum GapPosition {
  RIGHT = 'RIGHT', // a + b = ?
  LEFT = 'LEFT',   // ? + b = c
  MIXED = 'MIXED'  // Random
}

export type Language = 'en' | 'cn';

export interface GameConfig {
  numberRange: number;       // a1. Max number allowed in operands
  steps: number;             // a2. Number of operators (1 to 5)
  gapPosition: GapPosition;  // a3. Where is the question mark
  answerRange: number;       // a4. Max number allowed for the result
  difficultyRandom: boolean; // a5. Randomize difficulty downwards
  totalQuestions: number;    // a6. Total questions
  targetTimeSeconds: number; // a6. Target time for ONE question (controls speed)
  instantFeedback: boolean;  // b01. Show error immediately
}

export interface MathProblem {
  id: string;
  expression: string;      // The full expression e.g. "8 + 3"
  fullEquation: string;    // e.g. "8 + 3 = 11"
  maskedExpression: string; // e.g. "8 + 3 = ?" or "? + 3 = 11"
  answer: number;
  parts: (number | string)[]; // Tokenized parts for easier rendering
  correctAnswer: number;
}

export interface ProblemAttempt {
  problemId: string;
  problem: MathProblem;
  userAnswer: string;
  isCorrect: boolean;
  timeTakenMs: number;
  timestamp: number;
}

export interface GameSession {
  config: GameConfig;
  startTime: number;
  endTime: number;
  attempts: ProblemAttempt[];
}