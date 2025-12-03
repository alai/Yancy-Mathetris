import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Delete, CornerDownLeft, GripHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { GameConfig, MathProblem, ProblemAttempt, Language } from '../types';
import { MathEngine } from '../services/mathEngine';
import { getT } from '../utils/i18n';
import { audioManager } from '../utils/audio';

interface Props {
  config: GameConfig;
  onFinish: (attempts: ProblemAttempt[], durationMs: number) => void;
  onExit: () => void;
  language: Language;
}

export const GamePlay: React.FC<Props> = ({ config, onFinish, onExit, language }) => {
  const t = getT(language).game;
  
  // State
  const [queue, setQueue] = useState<MathProblem[]>([]);
  const [completed, setCompleted] = useState<MathProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [attempts, setAttempts] = useState<ProblemAttempt[]>([]);
  const [gameStartTime] = useState<number>(Date.now());
  const [problemStartTime, setProblemStartTime] = useState<number>(0);
  const [isFalling, setIsFalling] = useState(false);
  const [isError, setIsError] = useState(false);
  
  // Ref for the root container to constrain dragging to the whole screen
  const rootRef = useRef<HTMLDivElement>(null);
  
  // Ref for the current problem ID to handle timeouts correctly
  const problemIdRef = useRef<string | null>(null);

  // Initialize
  useEffect(() => {
    const problems = MathEngine.generateBank(config);
    setQueue(problems);
    // Start first problem
    nextProblem(problems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextProblem = (currentQueue: MathProblem[], currentAttempts?: ProblemAttempt[]) => {
    if (currentQueue.length === 0) {
      finishGame(currentAttempts);
      return;
    }
    const [next, ...rest] = currentQueue;
    setCurrentProblem(next);
    problemIdRef.current = next.id;
    setQueue(rest);
    setInputValue('');
    setProblemStartTime(Date.now());
    setIsFalling(true);
    setIsError(false);
    
    // Play spawn sound
    audioManager.playSpawn();
  };

  const finishGame = (finalAttempts?: ProblemAttempt[]) => {
    const totalDuration = Date.now() - gameStartTime;
    // Use the explicitly passed final attempts if available, otherwise fallback to state
    // This is crucial because state updates are async and 'attempts' might be stale in this closure
    const results = finalAttempts || attempts;
    onFinish(results, totalDuration);
  };

  const handleInput = useCallback((num: number) => {
    setInputValue((prev) => {
      if (prev.length >= 3) return prev; // Limit length
      return prev + num.toString();
    });
    setIsError(false); // Clear error on new input
  }, []);

  const handleBackspace = useCallback(() => {
    setInputValue((prev) => prev.slice(0, -1));
    setIsError(false);
  }, []);

  const handlePass = useCallback(() => {
    if (!currentProblem) return;
    
    // Move current to end of queue
    setQueue((prev) => [...prev, currentProblem]);
    
    // Reset visual
    setIsFalling(false);
    
    // Short delay to allow animation reset then load next
    setTimeout(() => {
      setQueue(prevQueue => {
         const [next, ...rest] = prevQueue;
         if(next) {
            setCurrentProblem(next);
            problemIdRef.current = next.id;
            setInputValue('');
            setProblemStartTime(Date.now());
            setIsFalling(true);
            setIsError(false);
            audioManager.playSpawn();
            return rest; 
         }
         return prevQueue;
      });
    }, 100);
  }, [currentProblem]);

  const handleSubmit = useCallback(() => {
    if (!currentProblem || inputValue === '') return;

    const val = parseInt(inputValue, 10);
    const isCorrect = val === currentProblem.correctAnswer;
    const now = Date.now();
    
    const attempt: ProblemAttempt = {
      problemId: currentProblem.id,
      problem: currentProblem,
      userAnswer: inputValue,
      isCorrect,
      timeTakenMs: now - problemStartTime,
      timestamp: now,
    };

    if (config.instantFeedback && !isCorrect) {
      // Visual feedback for error
      setIsError(true);
      setInputValue('');
      audioManager.playIncorrect();
      // Reset error state after animation
      setTimeout(() => setIsError(false), 500);
      return;
    }

    // Play correct sound if correct
    if (isCorrect) {
        audioManager.playCorrect();
    } else {
        // Delayed feedback mode incorrect sound (optional, but good for feedback)
        audioManager.playIncorrect(); 
    }

    // Record attempt - update state locally for UI
    const newAttempts = [...attempts, attempt];
    setAttempts(newAttempts);
    setCompleted((prev) => [currentProblem, ...prev]);
    
    // Stop falling animation
    setIsFalling(false);

    // Short delay for visual "success" before next
    setTimeout(() => {
        // Pass the newAttempts to nextProblem so it can pass them to finishGame if needed
        nextProblem(queue, newAttempts);
    }, 200);

  }, [currentProblem, inputValue, problemStartTime, queue, config.instantFeedback, attempts]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleInput(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === ' ' || e.key === 'ArrowDown') {
         e.preventDefault(); 
         handlePass();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, handleBackspace, handleSubmit, handlePass]);


  // Keypad Component
  const NumpadBtn = ({ v, onClick, className, children }: any) => (
    <button
      onClick={onClick}
      // Added preventDefault to onPointerDown to prevent dragging the parent when clicking buttons
      onPointerDown={(e) => e.stopPropagation()} 
      className={clsx(
        "h-14 md:h-16 rounded-xl text-2xl font-bold shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center backdrop-blur-sm touch-manipulation",
        className || "bg-white/90 text-slate-700 hover:bg-white"
      )}
    >
      {children || v}
    </button>
  );

  return (
    <div ref={rootRef} className="h-screen flex flex-col md:flex-row overflow-hidden bg-slate-100 font-sans relative">
      
      {/* LEFT: Completed / Status (Desktop) */}
      <div className="hidden md:flex flex-col w-64 bg-slate-200 border-r border-slate-300 p-4 z-30 shadow-lg relative">
        <div className="mb-6 flex items-center justify-between">
            <button onClick={onExit} className="p-2 hover:bg-slate-300 rounded-lg text-slate-600 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div className="font-mono text-slate-500 text-sm font-bold bg-slate-300/50 px-3 py-1 rounded-full">
                {t.queue}: {queue.length}
            </div>
        </div>
        
        <h3 className="font-bold text-slate-600 mb-4 uppercase text-xs tracking-wider">{t.completed}</h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {completed.map((p, i) => {
                const att = attempts.find(a => a.problemId === p.id);
                const correct = att ? att.isCorrect : true;
                return (
                    <div key={p.id} className={clsx("p-3 rounded-lg text-sm font-mono border-l-4 shadow-sm", correct ? "bg-white border-green-400" : "bg-red-50 border-red-400")}>
                        {p.fullEquation}
                    </div>
                );
            })}
        </div>
      </div>

      {/* CENTER: Game Area */}
      <div className="flex-1 relative bg-slate-50 flex flex-col overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden h-14 flex items-center justify-between px-4 border-b bg-white z-30 relative shadow-sm">
             <button onClick={onExit}><ArrowLeft /></button>
             <span className="font-mono font-bold text-slate-600">{completed.length} / {config.totalQuestions}</span>
        </div>

        {/* Falling Zone Container - Full Height */}
        <div className="absolute inset-0 flex justify-center overflow-hidden z-10">
            {/* Guide lines background */}
            <div className="absolute inset-0 grid grid-cols-12 gap-4 opacity-10 pointer-events-none">
                <div className="col-start-4 col-span-6 border-x border-slate-400 h-full border-dashed"></div>
            </div>

            <AnimatePresence mode="wait">
                {currentProblem && isFalling && (
                    <motion.div
                        key={currentProblem.id}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ 
                            y: '92vh', // Fall to very bottom
                            opacity: 1,
                            x: isError ? [0, -10, 10, -10, 10, 0] : 0 // Shake animation
                        }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ 
                            y: { 
                                duration: config.targetTimeSeconds, 
                                ease: "linear" 
                            },
                            opacity: { duration: 0.2 },
                            x: { duration: 0.4 } // Shake duration
                        }}
                        className="absolute top-0 z-10"
                    >
                        <div className={clsx(
                            "px-8 py-6 rounded-2xl shadow-2xl border-4 min-w-[280px] text-center transition-colors duration-200 backdrop-blur-md",
                            isError ? "bg-red-50/90 border-red-500" : "bg-white/90 border-blue-400"
                        )}>
                             <div className="text-4xl font-mono font-bold text-slate-800 tracking-wider">
                                {currentProblem.maskedExpression.split('?').map((part, i) => (
                                    <React.Fragment key={i}>
                                        {part}
                                        {i === 0 && (
                                            <span className={clsx(
                                                "inline-block min-w-[1.5em] border-b-4 px-2 mx-1 rounded transition-colors",
                                                isError ? "text-red-600 border-red-500 bg-red-100" : "text-blue-500 border-blue-500 bg-blue-50"
                                            )}>
                                                {inputValue || "?"}
                                            </span>
                                        )}
                                    </React.Fragment>
                                ))}
                             </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      {/* RIGHT: Queue (Upcoming) */}
      <div className="hidden lg:block w-48 bg-slate-100 border-l border-slate-300 p-6 z-30 shadow-lg relative">
        <h3 className="font-bold text-slate-400 mb-6 uppercase text-xs tracking-wider text-center">{t.nextUp}</h3>
        <div className="space-y-3 opacity-60">
            {queue.slice(0, 5).map((p, i) => (
                <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm text-center scale-90 text-slate-500 font-mono text-xs border border-slate-200">
                    {p.maskedExpression}
                </div>
            ))}
            {queue.length > 5 && (
                <div className="text-center text-slate-400 text-xs mt-4">
                    + {queue.length - 5} {t.more}
                </div>
            )}
        </div>
      </div>

      {/* Draggable Keypad - Floating Global */}
      <motion.div
            drag
            dragConstraints={rootRef}
            dragElastic={0.1}
            dragMomentum={false}
            initial={{ y: 0, x: '-50%' }}
            style={{ 
                left: '50%', 
                bottom: '2rem', 
                position: 'absolute',
                zIndex: 100
            }}
            className="touch-none" // Prevents browser scrolling while dragging
        >
            <div className="bg-slate-200/80 backdrop-blur-xl border border-white/60 p-4 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.2)] w-[340px] max-w-[95vw]">
                {/* Drag Handle */}
                <div className="flex justify-center mb-4 cursor-grab active:cursor-grabbing group">
                    <div className="w-16 h-1.5 bg-slate-300 rounded-full group-hover:bg-slate-400 transition-colors" />
                </div>
                
                <div className="flex flex-col gap-3">
                    {/* Display */}
                    <div className="bg-slate-800/90 backdrop-blur rounded-2xl p-3 text-right mb-1 shadow-inner border border-slate-700">
                        <span className={clsx(
                            "text-3xl font-mono tracking-[0.2em] transition-colors",
                            isError ? "text-red-400" : "text-green-400"
                        )}>
                            {inputValue || "_"}
                        </span>
                    </div>

                    {/* Keypad Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <NumpadBtn key={n} v={n} onClick={() => handleInput(n)} />
                        ))}
                        <NumpadBtn onClick={handlePass} className="bg-amber-100/90 text-amber-700 hover:bg-amber-100">
                            <span className="text-sm font-bold uppercase">{t.pass}</span>
                        </NumpadBtn>
                        <NumpadBtn v={0} onClick={() => handleInput(0)} />
                        <NumpadBtn onClick={handleSubmit} className="bg-green-500/90 text-white hover:bg-green-500 shadow-green-700/20">
                            <CornerDownLeft size={32} />
                        </NumpadBtn>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-1">
                         <button 
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={handleBackspace} 
                            className="bg-red-100/80 text-red-600 hover:bg-red-200 h-12 rounded-xl flex items-center justify-center font-bold shadow-sm backdrop-blur-sm transition-colors touch-manipulation"
                         >
                            <Delete className="mr-2 h-5 w-5" /> {t.backspace}
                         </button>
                         <div className="flex items-center justify-center text-xs text-slate-500 font-mono uppercase tracking-widest bg-white/30 rounded-xl cursor-grab active:cursor-grabbing">
                             <GripHorizontal className="mr-2 opacity-50" size={16}/> {t.dragMe}
                         </div>
                    </div>
                </div>
            </div>
        </motion.div>

    </div>
  );
};
