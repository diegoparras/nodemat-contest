
import React, { useMemo, useState } from 'react';
import { AgentConfig, Provider } from '../types';
import { fetchModelsForProvider } from '../services/openRouterService';
import { Settings, Key, Bot, FileText, ChevronDown, DollarSign, Database, Search, Power, Wifi, Loader2, Trash2 } from 'lucide-react';

interface Props {
  config: AgentConfig;
  onChange: (newConfig: AgentConfig) => void;
  disabled: boolean;
  availableModels: any[]; // Deprecated, we use config.modelList now
  currentCost: number;
}

const PROVIDERS: { id: Provider; name: string }[] = [
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'groq', name: 'Groq' },
  { id: 'gemini', name: 'Gemini AI' },
];

const AgentConfigPanel: React.FC<Props> = ({ config, onChange, disabled, currentCost }) => {
  const [modelSearch, setModelSearch] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleChange = (field: keyof AgentConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  const handleToggleConnection = async () => {
      // 1. Disconnect Logic
      if (config.isConnected) {
          onChange({ 
              ...config, 
              isConnected: false, 
              modelList: [], 
              model: '' 
          });
          return;
      }

      // 2. Connect Logic - Pre-validation
      if (!config.apiKey || config.apiKey.trim() === '') {
          onChange({ ...config, connectionError: 'Falta API Key' });
          return;
      }

      onChange({ ...config, isConnecting: true, connectionError: undefined });

      try {
          const models = await fetchModelsForProvider(config.provider, config.apiKey);
          
          // 3. Validation: If no models found, do NOT connect (unless OpenRouter which allows custom)
          if (models.length === 0 && config.provider !== 'openrouter') {
              throw new Error("No se encontraron modelos con esta API Key");
          }

          const defaultModel = models.length > 0 ? models[0].id : (config.provider === 'openrouter' ? 'custom' : '');

          onChange({
              ...config,
              isConnected: true,
              isConnecting: false,
              modelList: models,
              model: defaultModel,
              connectionError: undefined
          });
      } catch (err: any) {
          onChange({
              ...config,
              isConnected: false,
              isConnecting: false,
              connectionError: err.message || "Error de conexión"
          });
      }
  };

  const borderColor = config.id === 'A' ? 'border-cyan-500/30' : 'border-purple-500/30';
  const headerGradient = config.id === 'A' 
    ? 'bg-gradient-to-r from-cyan-900/50 to-blue-900/50' 
    : 'bg-gradient-to-r from-purple-900/50 to-pink-900/50';

  // Filter available models based on search
  const filteredModels = useMemo(() => {
    const search = modelSearch.toLowerCase();
    const list = config.modelList || [];
    return list.filter(m => 
        m.name.toLowerCase().includes(search) || 
        m.id.toLowerCase().includes(search)
    );
  }, [config.modelList, modelSearch]);

  // Group models by provider (Only for OpenRouter)
  const openRouterGroups = useMemo(() => {
    if (config.provider !== 'openrouter') return null;
    
    const groups: Record<string, typeof filteredModels> = {};
    
    filteredModels.forEach(model => {
      const provider = model.id.includes('/') ? model.id.split('/')[0] : 'other';
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(model);
    });

    const sortedProviders = Object.keys(groups).sort();
    return { groups, sortedProviders };
  }, [filteredModels, config.provider]);

  // Helper to determine if we are in "custom model" mode (OpenRouter only)
  // This is true if the current model is not found in the fetched list
  const isCustomModel = config.provider === 'openrouter' && 
    config.isConnected &&
    (config.model === 'custom' || (config.model !== '' && !config.modelList.find(m => m.id === config.model)));

  return (
    <div className={`flex flex-col w-full bg-white dark:bg-slate-900/80 backdrop-blur-sm border ${borderColor} rounded-xl overflow-hidden shadow-xl transition-all duration-300`}>
      {/* Header */}
      <div 
        className={`${headerGradient} p-4 border-b ${borderColor} flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
          <Bot className={`w-5 h-5 ${config.id === 'A' ? 'text-cyan-600 dark:text-cyan-400' : 'text-purple-600 dark:text-purple-400'}`} />
          <h2 className="font-bold text-lg text-slate-800 dark:text-white truncate max-w-[120px]">{config.name}</h2>
        </div>
        <div className="flex flex-col items-end">
             <div className={`px-2 py-0.5 rounded text-xs font-mono bg-black/10 dark:bg-black/40 ${config.id === 'A' ? 'text-cyan-700 dark:text-cyan-300' : 'text-purple-700 dark:text-purple-300'}`}>
              AGENTE {config.id}
            </div>
            {currentCost > 0 && (
                <div className="flex items-center text-[10px] text-green-600 dark:text-green-400 mt-1 font-mono">
                    <DollarSign className="w-3 h-3" />
                    {currentCost.toFixed(6)}
                </div>
            )}
        </div>
      </div>

      {/* Form Body - Collapsible with animation */}
      <div className={`grid transition-all duration-300 ease-in-out ${isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
        <div className="overflow-hidden">
            <div className="p-6 space-y-5">
                {/* Name Input */}
                <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Settings className="w-3 h-3" /> Nombre
                </label>
                <input
                    type="text"
                    value={config.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={disabled}
                    className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Nombre del Agente"
                />
                </div>

                {/* Provider Selector & Connection */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Database className="w-3 h-3" /> Proveedor
                        </label>
                        {/* Connection Status Indicator */}
                        <div className="flex items-center gap-2">
                            {config.connectionError && (
                                <span className="text-[10px] text-red-500 dark:text-red-400 max-w-[120px] truncate" title={config.connectionError}>
                                    {config.connectionError}
                                </span>
                            )}
                            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                                config.isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
                                config.connectionError ? 'bg-red-500' : 'bg-slate-400 dark:bg-slate-700'
                            }`} />
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select
                                value={config.provider}
                                onChange={(e) => {
                                    const newProvider = e.target.value as Provider;
                                    // Reset connection on provider change
                                    onChange({ 
                                        ...config, 
                                        provider: newProvider, 
                                        isConnected: false,
                                        modelList: [],
                                        model: ''
                                    });
                                    setModelSearch('');
                                }}
                                disabled={disabled || config.isConnected} // Disable changing provider while connected
                                className={`w-full appearance-none bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-8 ${config.isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {PROVIDERS.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                        
                        {/* Connection Toggle */}
                        <button
                            onClick={handleToggleConnection}
                            disabled={disabled || config.isConnecting || (!config.isConnected && !config.apiKey)}
                            className={`px-3 rounded-lg border transition-all flex items-center justify-center ${
                                config.isConnected 
                                    ? 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40' 
                                    : 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 disabled:opacity-30 disabled:cursor-not-allowed'
                            } ${config.isConnecting ? 'opacity-70 cursor-wait' : ''}`}
                            title={
                                config.isConnected ? "Desconectar" : 
                                !config.apiKey ? "Ingresa una API Key para conectar" : 
                                "Conectar y Cargar Modelos"
                            }
                        >
                            {config.isConnecting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : config.isConnected ? (
                                <Power className="w-4 h-4" />
                            ) : (
                                <Wifi className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3 h-3" /> API Key ({PROVIDERS.find(p => p.id === config.provider)?.name})
                </label>
                <div className="relative">
                    <input
                        type="password"
                        value={config.apiKey}
                        onChange={(e) => handleChange('apiKey', e.target.value)}
                        disabled={disabled} 
                        className={`w-full bg-gray-50 dark:bg-slate-800/50 border rounded-lg pl-3 pr-8 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono ${!config.apiKey && !config.isConnected ? 'border-amber-500/50' : 'border-gray-300 dark:border-slate-700'}`}
                        placeholder={config.provider === 'openrouter' ? "sk-or-..." : "sk-..."}
                    />
                    {config.apiKey && !disabled && (
                        <button 
                            onClick={() => handleChange('apiKey', '')}
                            className="absolute right-2 top-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="Borrar API Key"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
                </div>

                {/* Model Selector */}
                <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Bot className="w-3 h-3" /> Modelo
                    </label>
                </div>
                
                <div className={`relative ${!config.isConnected ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Search Input */}
                    <div className="relative mb-2">
                        <Search className="absolute left-2 top-2 w-3 h-3 text-slate-500" />
                        <input 
                            type="text"
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                            placeholder={config.isConnected ? "Buscar modelo..." : "Conecta para buscar"}
                            disabled={disabled || !config.isConnected}
                            className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={isCustomModel ? 'custom' : config.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                        disabled={disabled || !config.isConnected}
                        className="w-full appearance-none bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-8"
                    >
                        {!config.isConnected ? (
                             <option value="">Conecta para ver modelos</option>
                        ) : config.modelList.length === 0 && config.provider !== 'openrouter' ? (
                            <option value="">No se encontraron modelos</option>
                        ) : (
                            <>
                                {config.provider === 'openrouter' && openRouterGroups ? (
                                    <>
                                        {openRouterGroups.sortedProviders.map(provider => (
                                            <optgroup key={provider} label={provider.toUpperCase()}>
                                            {openRouterGroups.groups[provider].map(m => (
                                                <option key={m.id} value={m.id}>
                                                {m.name.replace(provider + '/', '')}
                                                </option>
                                            ))}
                                            </optgroup>
                                        ))}
                                        <option value="custom">Otro (Manual)</option>
                                    </>
                                ) : (
                                    filteredModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
                                )}
                            </>
                        )}
                    </select>
                    <ChevronDown className="absolute right-3 top-10 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                
                {/* Custom Model Input for OpenRouter */}
                {isCustomModel && (
                    <input
                    type="text"
                    value={config.model === 'custom' ? '' : config.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    disabled={disabled}
                    className="w-full mt-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                    placeholder="Escribe el ID del modelo (ej: openai/gpt-4-turbo)"
                    autoFocus
                />
                )}
                </div>

                {/* System Prompt */}
                <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3" /> System Prompt
                </label>
                <textarea
                    value={config.systemPrompt}
                    onChange={(e) => handleChange('systemPrompt', e.target.value)}
                    disabled={disabled}
                    className="w-full min-h-[120px] bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none custom-scrollbar font-mono leading-tight"
                    placeholder="Instrucciones para el agente..."
                />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AgentConfigPanel;
