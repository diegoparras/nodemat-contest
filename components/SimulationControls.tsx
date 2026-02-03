
import React from 'react';
import { Play, Pause, RefreshCw, MessageSquarePlus, Gamepad2, Download, Square, Zap, Hand, StepForward, FileJson, Info } from 'lucide-react';
import { SimulationState, Scenario } from '../types';
import { SCENARIOS } from '../constants';

interface Props {
  state: SimulationState;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onMaxIterationsChange: (n: number) => void;
  onInitialTopicChange: (s: string) => void;
  initialTopic: string;
  currentScenario: string;
  onScenarioChange: (scenarioId: string) => void;
  onExport: () => void;
  onExportJSON: () => void;
  hasMessages: boolean;
  onToggleMaxTokens: (enabled: boolean) => void;
  onMaxTokensChange: (n: number) => void;
  onToggleManualMode: (enabled: boolean) => void;
  onNextTurn: () => void;
}

const SimulationControls: React.FC<Props> = ({ 
  state, 
  onStart, 
  onPause,
  onStop,
  onReset, 
  onMaxIterationsChange,
  initialTopic,
  onInitialTopicChange,
  currentScenario,
  onScenarioChange,
  onExport,
  onExportJSON,
  hasMessages,
  onToggleMaxTokens,
  onMaxTokensChange,
  onToggleManualMode,
  onNextTurn
}) => {
  const isRunning = state.status === 'running';
  const progress = Math.min((state.iterationCount / state.maxIterations) * 100, 100);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center gap-6 justify-between">
        
        {/* Left: Controls */}
        <div className="flex items-center gap-3">
          {isRunning && !state.waitingForManualTrigger ? (
            <button 
              onClick={onPause}
              className="flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-white rounded-lg font-bold transition-all shadow-lg shadow-yellow-900/20 active:scale-95"
            >
              <Pause className="w-4 h-4 fill-current" /> Pausar
            </button>
          ) : isRunning && state.waitingForManualTrigger ? (
             <button 
             onClick={onNextTurn}
             className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 animate-pulse"
           >
             <StepForward className="w-4 h-4 fill-current" /> Siguiente Turno
           </button>
          ) : (
            <button 
              onClick={onStart}
              disabled={state.status === 'completed'}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95 ${
                state.status === 'completed' 
                  ? 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'
              }`}
            >
              <Play className="w-4 h-4 fill-current" /> {state.status === 'paused' ? 'Continuar' : 'Iniciar'}
            </button>
          )}

           {/* Stop Button */}
           <button 
              onClick={onStop}
              disabled={state.status === 'idle' || state.status === 'completed'}
              className={`flex items-center justify-center p-2 rounded-lg font-bold transition-all active:scale-95 border ${
                state.status === 'idle' || state.status === 'completed'
                ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-600 cursor-not-allowed'
                : 'bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 border-red-200 dark:border-red-700 text-red-600 dark:text-red-200'
              }`}
              title="Detener Simulación"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>

          <button 
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> Reiniciar
          </button>

          {hasMessages && (
             <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-0.5">
               <button 
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md font-medium transition-all"
                title="Descargar como Markdown (Texto)"
              >
                <Download className="w-4 h-4" />
              </button>
              <div className="w-px bg-gray-300 dark:bg-slate-700 my-1"></div>
              <button 
                onClick={onExportJSON}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 text-yellow-600 dark:text-yellow-500 rounded-md font-medium transition-all"
                title="Descargar estructura JSON (Debug)"
              >
                <FileJson className="w-4 h-4" />
              </button>
             </div>
          )}
        </div>

        {/* Center: Scenario & Topic */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 w-full max-w-xl">
          
          {/* Scenario Selector */}
          {state.status === 'idle' && (
            <div className="relative min-w-[200px]">
              <div className="absolute left-3 top-2.5 pointer-events-none">
                <Gamepad2 className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              </div>
              <select
                value={currentScenario}
                onChange={(e) => onScenarioChange(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
              >
                {SCENARIOS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Topic Input */}
          {state.status === 'idle' ? (
             <div className="flex-1 w-full relative">
               <MessageSquarePlus className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
               <input
                 type="text"
                 value={initialTopic}
                 onChange={(e) => onInitialTopicChange(e.target.value)}
                 placeholder="Tema inicial o primer mensaje..."
                 className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
               />
             </div>
          ) : (
            // Progress Bar (replaces inputs when running)
             <div className="flex-1 w-full flex flex-col gap-1 justify-center">
               <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                 <span>Progreso</span>
                 <span>{state.iterationCount} / {state.maxIterations} Turnos</span>
               </div>
               <div className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div 
                    className={`h-full transition-all duration-500 ease-out ${
                      state.status === 'completed' ? 'bg-green-500' : 
                      state.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                 />
               </div>
               {state.waitingForManualTrigger && (
                 <div className="text-[10px] text-blue-500 dark:text-blue-400 font-bold text-center animate-pulse uppercase tracking-wider">
                    Esperando confirmación...
                 </div>
               )}
             </div>
          )}
        </div>

        {/* Right: Limits Config */}
        <div className="flex flex-col gap-2 border-l border-gray-200 dark:border-slate-800 pl-4">
          <div className="flex items-center gap-6">
            
            {/* Manual Mode Toggle */}
            <div className="flex flex-col items-center">
               <label className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                 <Hand className="w-3 h-3" /> Manual
              </label>
               <button 
                    onClick={() => onToggleManualMode(!state.isManualMode)}
                    className={`relative w-8 h-4 rounded-full transition-colors ${state.isManualMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-slate-700'}`}
                    title={state.isManualMode ? "Modo Manual Activado" : "Modo Automático"}
                 >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${state.isManualMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Max Tokens Control */}
            <div className="flex flex-col items-end">
              <label className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                 <Zap className="w-3 h-3" /> Max Tokens
              </label>
              <div className="flex items-center gap-2">
                 <button 
                    onClick={() => onToggleMaxTokens(!state.useMaxTokens)}
                    className={`relative w-8 h-4 rounded-full transition-colors ${state.useMaxTokens ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}
                 >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${state.useMaxTokens ? 'translate-x-4' : 'translate-x-0'}`} />
                 </button>
                 {state.useMaxTokens && (
                     <input 
                        type="number"
                        value={state.maxTokens || ''}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            onMaxTokensChange(isNaN(val) ? 0 : val);
                        }}
                        onBlur={() => {
                            if (state.maxTokens < 100) {
                                onMaxTokensChange(100);
                            }
                        }}
                        className="w-16 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded px-1 py-0.5 text-xs text-center font-mono focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-200"
                        min={100}
                        step={100}
                     />
                 )}
              </div>
            </div>

            {/* Max Iterations */}
            <div className="flex flex-col items-end">
              <label className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">
                Máx Turnos
              </label>
              <div className="flex items-center bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-300 dark:border-slate-800 p-1">
                 <button 
                    onClick={() => onMaxIterationsChange(Math.max(2, state.maxIterations - 2))}
                    className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800 rounded"
                    disabled={state.status !== 'idle'}
                 >
                   -
                 </button>
                 <span className="w-8 text-center text-sm font-mono text-slate-900 dark:text-white">{state.maxIterations}</span>
                 <button 
                    onClick={() => onMaxIterationsChange(Math.min(50, state.maxIterations + 2))}
                    className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800 rounded"
                    disabled={state.status !== 'idle'}
                 >
                   +
                 </button>
              </div>
            </div>
          </div>
          
          {/* Warning Notice */}
          <div className="flex items-center justify-end gap-1.5 text-[9px] text-amber-600 dark:text-amber-500/80 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-900/30">
             <Info className="w-3 h-3" />
             <span>
               ¡Ojo! Modelos pequeños pueden fallar con muchos turnos. Info en <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-500 dark:hover:text-amber-400">openrouter.ai</a>
             </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SimulationControls;
