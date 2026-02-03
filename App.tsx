
import React, { useState, useEffect, useRef } from 'react';
import { AgentConfig, Message, SimulationState, SavedChat } from './types';
import { DEFAULT_CONFIG_A, DEFAULT_CONFIG_B, SCENARIOS } from './constants';
import { sendMessageToOpenRouter } from './services/openRouterService';
import AgentConfigPanel from './components/AgentConfigPanel';
import ChatBubble from './components/ChatBubble';
import SimulationControls from './components/SimulationControls';
import LoginScreen from './components/LoginScreen';
import Modal from './components/Modal';
import StorageModal from './components/StorageModal';
import HistoryList from './components/HistoryList';
import { Terminal, Swords, DollarSign, Menu, X, LogOut, Database, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Modals State
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);

  // Config State
  const [agentA, setAgentA] = useState<AgentConfig>(DEFAULT_CONFIG_A);
  const [agentB, setAgentB] = useState<AgentConfig>(DEFAULT_CONFIG_B);
  const [currentScenarioId, setCurrentScenarioId] = useState<string>(SCENARIOS[0].id);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Default to true (Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Cost State
  const [costA, setCostA] = useState<number>(0);
  const [costB, setCostB] = useState<number>(0);

  // Simulation State
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  
  const [simState, setSimState] = useState<SimulationState>({
    isPlaying: false,
    iterationCount: 0,
    maxIterations: 10,
    status: 'idle',
    error: null,
    currentTurn: null,
    logs: [],
    useMaxTokens: false,
    maxTokens: 1000,
    isManualMode: false,
    waitingForManualTrigger: false
  });
  
  const [initialTopic, setInitialTopic] = useState<string>(SCENARIOS[0].initialTopic);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // --- Effects ---

  // Initialize Dark Mode from Local Storage (Defaulting to Dark)
  useEffect(() => {
    const savedTheme = localStorage.getItem('nodemat_theme');
    
    // Only switch to light if explicitly saved as 'light'. Otherwise default to Dark.
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      if (!savedTheme) {
          localStorage.setItem('nodemat_theme', 'dark');
      }
    }
  }, []);

  // Toggle Theme Function
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nodemat_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nodemat_theme', 'light');
    }
  };

  // Load History from Local Storage on Mount
  useEffect(() => {
    const storedHistory = localStorage.getItem('nodemat_history');
    if (storedHistory) {
      try {
        setSavedChats(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save History to Local Storage whenever it changes
  useEffect(() => {
    localStorage.setItem('nodemat_history', JSON.stringify(savedChats));
  }, [savedChats]);

  // Scroll to bottom effect
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Scenario Change
  const handleScenarioChange = (scenarioId: string) => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    setCurrentScenarioId(scenarioId);
    setInitialTopic(scenario.initialTopic);

    // Update Agent A - Only update scenario specific fields, persist connection/model
    setAgentA(prev => ({
      ...prev,
      name: scenario.configA.name || prev.name,
      systemPrompt: scenario.configA.systemPrompt || ''
    }));

    // Update Agent B - Only update scenario specific fields, persist connection/model
    setAgentB(prev => ({
      ...prev,
      name: scenario.configB.name || prev.name,
      systemPrompt: scenario.configB.systemPrompt || ''
    }));
  };

  const calculateTurnCost = (agent: AgentConfig, promptTokens: number, completionTokens: number): number => {
      const modelData = agent.modelList.find(m => m.id === agent.model);
      if (modelData && modelData.pricing) {
          const promptPrice = parseFloat(modelData.pricing.prompt) || 0;
          const completionPrice = parseFloat(modelData.pricing.completion) || 0;
          return (promptTokens * promptPrice) + (completionTokens * completionPrice);
      }
      return 0; 
  };

  // Main Loop
  useEffect(() => {
    let isMounted = true;

    const processTurn = async () => {
      if (
        simState.status !== 'running' || 
        simState.iterationCount >= simState.maxIterations
      ) {
        if (simState.iterationCount >= simState.maxIterations && simState.status === 'running') {
            setSimState(prev => ({ ...prev, status: 'completed', isPlaying: false, logs: [...prev.logs, "Máximo de iteraciones alcanzado."] }));
        }
        return;
      }

      // Determine who speaks
      const currentAgent = simState.currentTurn === 'A' ? agentA : agentB;
      const otherAgent = simState.currentTurn === 'A' ? agentB : agentA;

      if (!currentAgent.isConnected || !currentAgent.model) {
          setSimState(prev => ({
            ...prev,
            status: 'error',
            error: `El Agente ${currentAgent.id} no está conectado o no tiene modelo seleccionado.`,
            isPlaying: false
          }));
          return;
      }

      try {
        const dynamicContextLimit = Math.max(3000, simState.maxIterations * 3000);

        const response = await sendMessageToOpenRouter(
          currentAgent.apiKey,
          currentAgent.model,
          currentAgent.systemPrompt,
          messages,
          currentAgent.id,
          currentAgent.provider,
          dynamicContextLimit,
          { enabled: simState.useMaxTokens, limit: simState.maxTokens }
        );

        if (!isMounted) return;

        // Calculate Cost
        if (response.usage) {
            const cost = calculateTurnCost(
                currentAgent,
                response.usage.prompt_tokens, 
                response.usage.completion_tokens
            );
            if (currentAgent.id === 'A') {
                setCostA(prev => prev + cost);
            } else {
                setCostB(prev => prev + cost);
            }
        }

        const newMessage: Message = {
          id: Date.now().toString(),
          sender: currentAgent.id,
          text: response.content,
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, newMessage]);
        setSimState(prev => ({
          ...prev,
          iterationCount: prev.iterationCount + 1,
          currentTurn: otherAgent.id, // Switch turn
          logs: [...prev.logs, `${currentAgent.name} completó su turno.`],
          waitingForManualTrigger: prev.isManualMode
        }));

      } catch (error: any) {
        if (!isMounted) return;
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: currentAgent.id,
            text: `Error: ${error.message || 'Error desconocido'}`,
            timestamp: Date.now(),
            isError: true
        }]);
        setSimState(prev => ({
            ...prev,
            status: 'error',
            error: error.message,
            isPlaying: false,
            logs: [...prev.logs, `Error en turno de ${currentAgent.name}: ${error.message}`]
        }));
      }
    };

    if (simState.status === 'running' && !simState.waitingForManualTrigger) {
        const timer = setTimeout(processTurn, 1000); 
        return () => clearTimeout(timer);
    }

    return () => { isMounted = false; };
  }, [simState.status, simState.currentTurn, simState.iterationCount, messages, agentA, agentB, simState.maxIterations, simState.useMaxTokens, simState.maxTokens, simState.waitingForManualTrigger]);


  // --- Storage & History Logic ---

  const getStorageSize = (): string => {
      let total = 0;
      for (let x in localStorage) {
          if (!localStorage.hasOwnProperty(x)) continue;
          total += ((localStorage[x].length + x.length) * 2);
      }
      return (total / 1024).toFixed(2) + " KB";
  };

  const clearStorage = () => {
      localStorage.removeItem('nodemat_history');
      setSavedChats([]);
      setShowStorageModal(false);
  };

  const downloadStorage = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedChats));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "nodemat_memory_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const deleteChat = (id: string) => {
      if (window.confirm('¿Borrar este chat del historial?')) {
          setSavedChats(prev => prev.filter(c => c.id !== id));
      }
  };

  const loadChat = (chat: SavedChat) => {
      if (simState.status === 'running') {
          alert("Pausa la simulación antes de cargar un historial.");
          return;
      }
      if (window.confirm('Cargar este chat reemplazará los mensajes actuales. ¿Continuar?')) {
          setMessages(chat.messages);
          setSimState(prev => ({
              ...prev,
              status: 'idle',
              error: null,
              logs: [`Historial cargado: ${chat.scenarioName}`]
          }));
      }
  };


  // --- Controls Handlers ---

  const handleStart = () => {
    // Validation
    if (!agentA.isConnected || !agentB.isConnected || !agentA.model || !agentB.model) {
      setShowWarningModal(true);
      return;
    }

    if (simState.status === 'paused') {
      setSimState(prev => ({ ...prev, status: 'running', isPlaying: true }));
      return;
    }

    // New Start
    const startingAgent = Math.random() > 0.5 ? 'A' : 'B';
    setCostA(0); setCostB(0);
    
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    const topicMessage: Message = {
        id: 'topic',
        sender: 'System', 
        text: initialTopic, 
        timestamp: Date.now()
    };

    setMessages([topicMessage]);
    setSimState({
      isPlaying: true,
      iterationCount: 0,
      maxIterations: simState.maxIterations,
      status: 'running',
      error: null,
      currentTurn: startingAgent,
      logs: [`Simulación iniciada. Empieza ${startingAgent === 'A' ? agentA.name : agentB.name}.`],
      useMaxTokens: simState.useMaxTokens,
      maxTokens: simState.maxTokens,
      isManualMode: simState.isManualMode,
      waitingForManualTrigger: false
    });
  };

  const handlePause = () => {
    setSimState(prev => ({ ...prev, status: 'paused', isPlaying: false, logs: [...prev.logs, "Simulación pausada."] }));
  };

  const handleStop = () => {
    setSimState(prev => ({ ...prev, status: 'completed', isPlaying: false, logs: [...prev.logs, "Simulación detenida por el usuario."] }));
  };

  const handleReset = () => {
    if (messages.length > 1) { 
        const scenarioName = SCENARIOS.find(s => s.id === currentScenarioId)?.name || 'Custom';
        const newSavedChat: SavedChat = {
            id: Date.now().toString(),
            date: Date.now(),
            scenarioName: scenarioName,
            messages: messages,
            agentAName: agentA.name,
            agentBName: agentB.name,
            costTotal: costA + costB
        };
        setSavedChats(prev => [...prev, newSavedChat]);
    }

    setMessages([]);
    setCostA(0);
    setCostB(0);
    setSimState(prev => ({ 
        ...prev, 
        status: 'idle', 
        isPlaying: false, 
        iterationCount: 0, 
        error: null, 
        currentTurn: null,
        logs: [],
        waitingForManualTrigger: false
    }));
  };

  const handleToggleManualMode = (enabled: boolean) => {
    setSimState(prev => ({
        ...prev,
        isManualMode: enabled,
        waitingForManualTrigger: enabled ? prev.waitingForManualTrigger : false
    }));
  };

  const handleNextTurn = () => {
    setSimState(prev => ({ ...prev, waitingForManualTrigger: false }));
  };

  const handleExport = () => {
    const scenarioName = SCENARIOS.find(s => s.id === currentScenarioId)?.name || 'Desconocido';
    let content = `# Nodemat Contest - Historial de Chat\n\n`;
    content += `**Fecha:** ${new Date().toLocaleString()}\n`;
    content += `**Escenario:** ${scenarioName}\n\n`;
    content += `--- \n`;
    content += `**Agente A:** ${agentA.name} (${agentA.provider}/${agentA.model})\n`;
    content += `**Agente B:** ${agentB.name} (${agentB.provider}/${agentB.model})\n`;
    content += `**Costos (Estimados):** A: $${costA.toFixed(6)} | B: $${costB.toFixed(6)}\n`;
    content += `--- \n\n`;

    messages.forEach(msg => {
        const senderName = msg.sender === 'System' ? 'SISTEMA' : (msg.sender === 'A' ? agentA.name : agentB.name);
        content += `### ${senderName} (${new Date(msg.timestamp).toLocaleTimeString()})\n`;
        content += `${msg.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nodemat-contest-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
      const debugData = {
          metadata: {
              timestamp: new Date().toISOString(),
              scenario: currentScenarioId,
              agentA: { name: agentA.name, model: agentA.model },
              agentB: { name: agentB.name, model: agentB.model },
              simulationState: simState
          },
          messages: messages
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(debugData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `nodemat-debug-${Date.now()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  if (!isLoggedIn) {
      return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-200 overflow-hidden transition-colors duration-300">
      
      <Modal 
        isOpen={showWarningModal} 
        onClose={() => setShowWarningModal(false)}
        title="¡Faltan credenciales!"
      >
        <p>Antes de la diversión, tenés que cargar las api keys de ambos agentes, conectarlos y elegir un modelo.</p>
      </Modal>

      <StorageModal 
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        usedSpace={getStorageSize()}
        onClearStorage={clearStorage}
        onDownloadBackup={downloadStorage}
      />

      {/* Top Bar */}
      <header className="h-16 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
             {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-2 rounded-lg shadow-lg shadow-red-900/20 hidden md:block">
               <Swords className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight dark:text-white text-slate-900">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 dark:from-red-400 dark:to-orange-400">Nodemat</span> Contest
            </h1>
          </div>
        </div>
        
        {/* Cost Display in Header */}
        <div className="flex items-center gap-3 md:gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                <span className="text-slate-500 dark:text-slate-400 hidden md:inline">Agente A:</span>
                <span className="text-emerald-600 dark:text-green-400 flex items-center"><DollarSign className="w-3 h-3" />{costA.toFixed(5)}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-slate-500 dark:text-slate-400 hidden md:inline">Agente B:</span>
                <span className="text-emerald-600 dark:text-green-400 flex items-center"><DollarSign className="w-3 h-3" />{costB.toFixed(5)}</span>
            </div>
        </div>

        <div className="text-xs font-mono text-slate-500 flex items-center gap-4">
          <button onClick={() => setShowStorageModal(true)} title="Base de Datos / Memoria">
            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300" />
          </button>
          
          <button 
             onClick={toggleTheme}
             title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
             className="text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-yellow-400 transition-colors"
          >
             {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <span className={`w-2 h-2 rounded-full ${simState.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
          <span className="hidden md:inline">{simState.status.toUpperCase()}</span>
          <button onClick={() => setIsLoggedIn(false)} title="Cerrar Sesión">
              <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Config Panel (Collapsible) */}
        <div 
          className={`
            border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0f1623] transition-all duration-300 ease-in-out z-30 absolute md:relative h-full shadow-lg dark:shadow-none
            ${isSidebarOpen ? 'translate-x-0 w-80 opacity-100' : '-translate-x-full w-0 opacity-0 md:w-0 md:overflow-hidden md:translate-x-0'}
          `}
        >
           <div className="h-full overflow-y-auto custom-scrollbar w-80 flex flex-col">
              <div className="p-4 flex-1">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Configuración
                </h3>
                <div className="space-y-6">
                    <AgentConfigPanel 
                        config={agentA} 
                        onChange={setAgentA} 
                        disabled={simState.status !== 'idle'}
                        availableModels={[]} 
                        currentCost={costA}
                    />
                    <div className="flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-gray-200 dark:bg-slate-900 px-2 py-1 rounded-full border border-gray-300 dark:border-slate-800">VS</span>
                    </div>
                    <AgentConfigPanel 
                        config={agentB} 
                        onChange={setAgentB} 
                        disabled={simState.status !== 'idle'} 
                        availableModels={[]} 
                        currentCost={costB}
                    />
                </div>
              </div>
              
              <HistoryList 
                history={savedChats}
                onDelete={deleteChat}
                onLoad={loadChat}
              />
           </div>
        </div>

        {/* Center Chat Arena */}
        <div className="flex-1 flex flex-col relative bg-gray-50/50 dark:bg-slate-950/50">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth">
                <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-end">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 py-20 opacity-50">
                            <Swords className="w-16 h-16 mb-4 stroke-1 opacity-50" />
                            <p className="text-lg font-light mb-2">Configura los agentes o elige un desafío</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500">
                                Escenario actual: <span className="text-purple-500 dark:text-purple-400">{SCENARIOS.find(s => s.id === currentScenarioId)?.name}</span>
                            </p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <ChatBubble 
                            key={msg.id} 
                            message={msg} 
                            agentA={agentA} 
                            agentB={agentB} 
                        />
                    ))}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Turn Indicator Overlay */}
            {simState.status === 'running' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
                    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur text-slate-800 dark:text-white px-4 py-1.5 rounded-full text-xs font-mono border border-gray-200 dark:border-slate-700 shadow-xl flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full animate-bounce ${simState.currentTurn === 'A' ? 'bg-cyan-500' : 'bg-purple-500'}`} />
                         Pensando: {simState.currentTurn === 'A' ? agentA.name : agentB.name}...
                    </div>
                </div>
            )}
        </div>

      </div>

      {/* Bottom Controls */}
      <SimulationControls 
        state={simState}
        onStart={handleStart}
        onPause={handlePause}
        onStop={handleStop}
        onReset={handleReset}
        onMaxIterationsChange={(n) => setSimState(s => ({ ...s, maxIterations: n }))}
        onInitialTopicChange={setInitialTopic}
        initialTopic={initialTopic}
        currentScenario={currentScenarioId}
        onScenarioChange={handleScenarioChange}
        onExport={handleExport}
        onExportJSON={handleExportJSON}
        hasMessages={messages.length > 0}
        onToggleMaxTokens={(enabled) => setSimState(s => ({ ...s, useMaxTokens: enabled }))}
        onMaxTokensChange={(n) => setSimState(s => ({ ...s, maxTokens: n }))}
        onToggleManualMode={handleToggleManualMode}
        onNextTurn={handleNextTurn}
      />

    </div>
  );
};

export default App;
