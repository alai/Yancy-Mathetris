import React, { useRef } from 'react';
import { GameConfig, ProblemAttempt, Language } from '../types';
import { format } from 'date-fns';
import { Printer, Home, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import clsx from 'clsx';
import { getT } from '../utils/i18n';

// Declare html2canvas globally as we are loading it via script tag
declare const html2canvas: any;

interface Props {
  attempts: ProblemAttempt[];
  totalDuration: number;
  config: GameConfig;
  onHome: () => void;
  language: Language;
}

export const ResultScreen: React.FC<Props> = ({ attempts, totalDuration, config, onHome, language }) => {
  const t = getT(language).report;
  const paperRef = useRef<HTMLDivElement>(null);
  
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const accuracy = attempts.length > 0 ? (correctCount / attempts.length) * 100 : 0;
  
  // Format duration to mm:ss
  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (paperRef.current && typeof html2canvas !== 'undefined') {
      try {
        const canvas = await html2canvas(paperRef.current, {
           scale: 2, // Higher resolution
           useCORS: true,
           backgroundColor: '#ffffff'
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `Yancy-Mathetris-Report-${format(new Date(), 'yyyy-MM-dd')}.png`;
        link.click();
      } catch (err) {
        console.error("Failed to generate image", err);
        alert("Could not generate image. Please try printing to PDF instead.");
      }
    } else {
        alert("Image generation library not loaded. Please use Print.");
    }
  };

  const renderWorksheetItem = (att: ProblemAttempt, i: number) => {
      const parts = att.problem.fullEquation.split('=');
      const idealLhs = parts[0].trim(); // e.g. "15 + 5"
      const idealRhs = parts[1].trim(); // e.g. "20"
      
      // Determine if the gap was on the right (ends with ?)
      const isRightGap = att.problem.maskedExpression.trim().endsWith('?');
      
      // Style for the user's input
      const userInputStyle = clsx(
          "font-bold text-xl px-1",
          att.isCorrect ? "text-indigo-900" : "text-red-600 line-through decoration-2"
      );

      // Render the User Input Element (with potential correction)
      const renderUserValue = () => (
          <span className="inline-flex items-center">
              <span className={userInputStyle}>{att.userAnswer}</span>
              {!att.isCorrect && (
                  <span className="text-[10px] text-slate-500 font-bold ml-1 bg-slate-100 px-1 rounded border border-slate-300">
                      {att.problem.correctAnswer}
                  </span>
              )}
          </span>
      );

      return (
        <div 
            key={i} 
            className={clsx(
                "border-2 rounded-lg p-2 flex flex-col items-center justify-center h-28 relative bg-slate-50/50",
                att.isCorrect ? "border-slate-200" : "border-red-200 bg-red-50"
            )}
        >
            <div className="absolute top-1 left-2 text-[10px] text-slate-400 font-bold">{i + 1}</div>

            {/* TOP: Left Hand Side */}
            <div className="flex items-end justify-center w-full h-1/2 pb-1 border-b border-slate-300 font-mono text-lg text-slate-600">
                {isRightGap ? (
                    // Gap is on right, so LHS is static (e.g., "15 + 5")
                    <span>{idealLhs}</span>
                ) : (
                    // Gap is on left, so we reconstruct LHS with user input
                    // We assume the first number was the gap based on engine logic
                    <span className="flex items-center">
                         {renderUserValue()}
                         {/* Get the rest of the string after the first number */}
                         <span>{idealLhs.substring(idealLhs.indexOf(' '))}</span>
                    </span>
                )}
            </div>

            {/* BOTTOM: Right Hand Side */}
            <div className="flex items-start justify-center w-full h-1/2 pt-1 font-mono text-lg text-slate-600">
                 {isRightGap ? (
                     // Gap is on right, so RHS is the user input
                     renderUserValue()
                 ) : (
                     // Gap is on left, so RHS is static result
                     <span>{idealRhs}</span>
                 )}
            </div>

            {/* Status Icon */}
            <div className="absolute top-1 right-1 print:hidden">
                    {att.isCorrect ? (
                        <CheckCircle size={14} className="text-green-500 opacity-50" />
                    ) : (
                        <XCircle size={14} className="text-red-500 opacity-50" />
                    )}
            </div>
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-slate-100 overflow-auto">
      
      {/* ----------------- ACTION BAR (Screen Only) ----------------- */}
      <div className="bg-white border-b p-4 shadow-sm print:hidden sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={onHome} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-bold transition-colors">
            <Home size={20} /> {t.backMenu}
          </button>
          
          <div className="flex gap-3">
             <button onClick={handleDownloadImage} className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-200 transition-colors">
                <Download size={18} /> {t.exportImg}
             </button>
             <button onClick={handlePrint} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                <Printer size={18} /> {t.printPdf}
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8 flex flex-col items-center gap-8 print:p-0 print:block">

        {/* ----------------- DIGITAL DASHBOARD (Screen Only) ----------------- */}
        <div className="w-full print:hidden">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-8">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
                                {t.title}
                            </h1>
                            <p className="opacity-90 font-mono text-lg">{format(new Date(), 'MMMM do, yyyy - h:mm a')}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-6xl font-black">{Math.round(accuracy)}%</div>
                            <div className="text-sm uppercase tracking-wider font-bold opacity-80">{t.accuracyScore}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-px bg-slate-200">
                    <StatBox label={t.questions} value={attempts.length.toString()} icon={<Download size={16}/>} />
                    <StatBox label={t.correct} value={correctCount.toString()} color="text-green-600" icon={<CheckCircle size={16}/>} />
                    <StatBox label={t.totalTime} value={formatDuration(totalDuration)} color="text-indigo-600" icon={<Clock size={16}/>} />
                    <StatBox label={t.incorrect} value={(attempts.length - correctCount).toString()} color="text-red-600" icon={<XCircle size={16}/>} />
                </div>
            </div>
            
            <p className="text-center text-slate-500 text-sm">
                {t.footer}
            </p>
        </div>

        {/* ----------------- WORKSHEET VIEW (Export/Print Target) ----------------- */}
        <div 
            id="report-paper"
            ref={paperRef}
            className="bg-white shadow-2xl p-12 w-full max-w-[210mm] aspect-[210/297] mx-auto text-slate-900 relative print:shadow-none print:w-full print:max-w-none print:aspect-auto print:h-full"
        >
            {/* Worksheet Header */}
            <div className="border-b-4 border-slate-800 pb-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
                        {t.title}
                    </h2>
                    <div className="text-right">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.accuracyScore}</div>
                        <div className="text-5xl font-black text-slate-900">{Math.round(accuracy)}<span className="text-2xl">%</span></div>
                    </div>
                </div>

                {/* Info Fields */}
                <div className="grid grid-cols-2 gap-8 font-mono text-sm">
                    <div className="space-y-4">
                        <div className="flex items-end gap-2">
                            <span className="font-bold uppercase tracking-wider w-16 text-slate-500">{t.name}</span>
                            <div className="flex-1 border-b-2 border-slate-300 pb-1 font-bold text-xl text-indigo-900">Yancy</div>
                        </div>
                         <div className="flex items-end gap-2">
                            <span className="font-bold uppercase tracking-wider w-16 text-slate-500">{t.date}</span>
                            <div className="flex-1 border-b-2 border-slate-300 pb-1">{format(new Date(), 'yyyy / MM / dd')}</div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-end gap-2">
                            <span className="font-bold uppercase tracking-wider w-20 text-slate-500">{t.time}</span>
                            <div className="flex-1 border-b-2 border-slate-300 pb-1 font-bold">{formatDuration(totalDuration)}</div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="font-bold uppercase tracking-wider w-20 text-slate-500">{t.sign}</span>
                            <div className="flex-1 border-b-2 border-slate-300 pb-1"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions Grid - 5 Columns */}
            <div className="grid grid-cols-5 gap-4">
                {attempts.map((att, i) => renderWorksheetItem(att, i))}
            </div>

            <div className="mt-12 text-center text-slate-400 text-xs font-mono uppercase tracking-widest opacity-50">
                {t.generatedBy}
            </div>

        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color = "text-slate-800", icon }: any) => (
    <div className="bg-white p-6 flex flex-col items-center justify-center">
        <div className={`text-3xl font-bold ${color} mb-1 flex items-center gap-2`}>
            {value}
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
);