import { GameConfig, GapPosition, MathProblem } from '../types';

const OPERATORS = ['+', '-'];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSingleProblem(config: GameConfig, index: number): MathProblem {
  let steps = config.steps;
  let range = config.numberRange;
  let ansRange = config.answerRange;

  // a5. Difficulty Randomization
  // If true, we might generate a simpler problem (fewer steps, smaller range) for variety
  if (config.difficultyRandom && Math.random() > 0.5) {
    steps = Math.max(1, getRandomInt(1, steps));
    range = Math.max(10, getRandomInt(10, range));
    // Keep answer range consistent to avoid confusion, or scale it too? Let's keep strict constraint.
  }

  let isValid = false;
  let expression = '';
  let finalResult = 0;
  let parts: (string | number)[] = [];

  // Retry loop to ensure constraints (non-negative, within range)
  let attempts = 0;
  while (!isValid && attempts < 100) {
    attempts++;
    parts = [];
    
    // Start with a number
    let currentVal = getRandomInt(1, Math.min(range, ansRange)); // Initial number usually shouldn't exceed answer range significantly
    parts.push(currentVal);
    
    let tempResult = currentVal;
    let tempExp = `${currentVal}`;
    let stepValid = true;

    for (let i = 0; i < steps; i++) {
      const op = OPERATORS[getRandomInt(0, OPERATORS.length - 1)];
      // Generate next operand. 
      // Heuristic: If we are adding, pick small. If subtracting, pick valid.
      let operand = getRandomInt(1, range);

      if (op === '+') {
        // Ensure we don't blow the answer range too easily
        if (tempResult + operand > ansRange) {
          // Try to adjust operand
          operand = getRandomInt(1, Math.max(1, ansRange - tempResult));
        }
      } else {
        // Ensure result doesn't go below 0 (assuming kids logic)
        if (tempResult - operand < 0) {
           operand = getRandomInt(1, tempResult);
        }
      }

      tempResult = op === '+' ? tempResult + operand : tempResult - operand;
      tempExp += ` ${op} ${operand}`;
      parts.push(op, operand);

      // Hard Constraint: Intermediate values shouldn't be negative for basic math
      if (tempResult < 0 || tempResult > ansRange) {
        stepValid = false;
        break;
      }
    }

    if (stepValid) {
      finalResult = tempResult;
      expression = tempExp;
      isValid = true;
    }
  }

  // Determine Gap Position
  let gapPos = config.gapPosition;
  if (gapPos === GapPosition.MIXED) {
    gapPos = Math.random() > 0.5 ? GapPosition.LEFT : GapPosition.RIGHT;
  }

  let maskedExpression = '';
  let correctAnswer = 0;

  if (gapPos === GapPosition.RIGHT) {
    // Standard: 8 + 3 = ?
    maskedExpression = `${expression} = ?`;
    correctAnswer = finalResult;
  } else {
    // Reverse: ? + 3 = 11 OR 8 + ? = 11
    // For simplicity in multi-step, we usually mask one of the operands or the first one.
    // Let's strictly implement "Left" as masking the FIRST operand for simplicity in multi-step,
    // otherwise parsing 8 + ? - 2 = 10 is complex for kids visual linear reading.
    
    // Actually, "Left" usually means the unknown is on the left side of equals.
    // Let's mask the first number.
    const firstNum = parts[0] as number;
    const restOfExp = expression.substring(String(firstNum).length);
    maskedExpression = `? ${restOfExp} = ${finalResult}`;
    correctAnswer = firstNum;
  }

  return {
    id: `p-${Date.now()}-${index}`,
    expression,
    fullEquation: `${expression} = ${finalResult}`,
    maskedExpression,
    answer: finalResult,
    parts: parts,
    correctAnswer
  };
}

export const MathEngine = {
  generateBank: (config: GameConfig): MathProblem[] => {
    const problems: MathProblem[] = [];
    for (let i = 0; i < config.totalQuestions; i++) {
      problems.push(generateSingleProblem(config, i));
    }
    return problems;
  }
};