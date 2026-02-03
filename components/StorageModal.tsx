
import React from 'react';
import { X, Database, Download, Trash2, HardDrive } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  usedSpace: string; // e.g., "15 KB"
  onClearStorage: () => void;
  onDownloadBackup: () => void;
}

const StorageModal: React.FC<Props> = ({ isOpen, onClose, usedSpace, onClearStorage, onDownloadBackup }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2 text-blue-400">
             <Database className="w-5 h-5" />
             <h3 className="font-bold text-lg text-white">Gestión de Memoria</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-xl border border-slate-800">
                <HardDrive className="w-12 h-12 text-slate-600 mb-2" />
                <p className="text-slate-400 text-sm">Espacio utilizado en Local Storage</p>
                <p className="text-2xl font-bold text-white mt-1">{usedSpace}</p>
            </div>

            <div className="space-y-3">
                <button 
                    onClick={onDownloadBackup}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                >
                    <Download className="w-4 h-4" />
                    Descargar Memoria (JSON)
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-900 px-2 text-slate-500">Zona de Peligro</span>
                    </div>
                </div>

                <button 
                    onClick={() => {
                        if (window.confirm('¿Estás seguro? Esto borrará todo el historial de chats y las configuraciones guardadas.')) {
                            onClearStorage();
                        }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Borrar Todo (Reset Factory)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StorageModal;
