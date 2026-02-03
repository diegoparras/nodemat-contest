
import React from 'react';
import { SavedChat } from '../types';
import { Trash2, MessageSquare, Clock, Eye } from 'lucide-react';

interface Props {
  history: SavedChat[];
  onDelete: (id: string) => void;
  onLoad: (chat: SavedChat) => void;
}

const HistoryList: React.FC<Props> = ({ history, onDelete, onLoad }) => {
  if (history.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs italic border-t border-gray-200 dark:border-slate-800">
        No hay historial guardado.
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-slate-800 p-4">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
         <Clock className="w-4 h-4" /> Historial
      </h3>
      <div className="space-y-3">
        {history.slice().reverse().map((chat) => (
          <div key={chat.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-3 hover:border-gray-300 dark:hover:border-slate-700 transition-colors group shadow-sm dark:shadow-none">
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate max-w-[140px]" title={chat.scenarioName}>
                    {chat.scenarioName}
                </h4>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                    {new Date(chat.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
            </div>
            
            <div className="flex justify-between items-end">
                <div className="text-[10px] text-slate-500 flex flex-col gap-0.5">
                    <span>{chat.messages.length} mensajes</span>
                    <span className="truncate max-w-[120px]">{chat.agentAName} vs {chat.agentBName}</span>
                </div>
                
                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onLoad(chat)}
                        className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                        title="Ver Chat"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={() => onDelete(chat.id)}
                        className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        title="Eliminar"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
