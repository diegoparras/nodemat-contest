
export type Provider = 'openrouter' | 'openai' | 'groq' | 'gemini';

export interface AgentConfig {
  id: 'A' | 'B';
  name: string;
  provider: Provider;
  apiKey: string;
  model: string;
  systemPrompt: string;
  color: string;
  avatar?: string;
  // Connection State
  isConnected: boolean;
  isConnecting: boolean;
  connectionError?: string;
  modelList: OpenRouterModel[];
}

export interface Message {
  id: string;
  sender: 'A' | 'B' | 'System';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface SavedChat {
  id: string;
  scenarioName: string;
  date: number;
  messages: Message[];
  agentAName: string;
  agentBName: string;
  costTotal: number;
}

export interface SimulationState {
  isPlaying: boolean;
  iterationCount: number;
  maxIterations: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  error: string | null;
  currentTurn: 'A' | 'B' | null;
  logs: string[];
  // Token Limits
  useMaxTokens: boolean;
  maxTokens: number;
  // Flow Control
  isManualMode: boolean;
  waitingForManualTrigger: boolean;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  initialTopic: string;
  configA: Partial<AgentConfig>;
  configB: Partial<AgentConfig>;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  content: string;
  usage?: TokenUsage;
}
