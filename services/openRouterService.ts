
import { Message, OpenRouterModel, ChatResponse, Provider } from '../types';

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Helper to estimate tokens (rough approximation: 4 chars = 1 token)
const estimateTokens = (text: string): number => Math.ceil((text || '').length / 4);

// Helper to prune history based on max input tokens (Context Window)
const pruneHistory = (
  systemPrompt: string, 
  history: Message[], 
  currentAgentId: 'A' | 'B', 
  maxInputTokens: number
): OpenRouterMessage[] => {
  
  let currentTokens = 0;
  let effectiveSystemPrompt = systemPrompt;
  const systemTokens = estimateTokens(systemPrompt);

  // 1. Check if System Prompt itself exceeds the limit
  if (systemTokens > maxInputTokens) {
     const maxChars = maxInputTokens * 4;
     effectiveSystemPrompt = systemPrompt.substring(0, maxChars) + "... [Truncado por límite]";
     currentTokens = estimateTokens(effectiveSystemPrompt);
  } else {
     currentTokens = systemTokens;
  }
  
  // 2. Prepare full history mapped correctly
  // If Agent A is sending, Agent A's past messages are 'assistant', Agent B's are 'user'.
  const fullHistory: OpenRouterMessage[] = history.filter(m => m.sender !== 'System').map((msg) => ({
    role: msg.sender === currentAgentId ? 'assistant' : 'user',
    content: msg.text,
  }));

  // 3. Add history backwards until full
  const keptMessages: OpenRouterMessage[] = [];
  
  // Reserve space for the response (heuristic: 500 tokens safety buffer)
  const availableForHistory = maxInputTokens - currentTokens - 500; 

  let usedHistoryTokens = 0;

  for (let i = fullHistory.length - 1; i >= 0; i--) {
    const msg = fullHistory[i];
    const msgTokens = estimateTokens(msg.content);
    
    if (usedHistoryTokens + msgTokens <= availableForHistory) {
      keptMessages.unshift(msg);
      usedHistoryTokens += msgTokens;
    } else {
      break; 
    }
  }

  // Prepend system prompt
  return [{ role: 'system', content: effectiveSystemPrompt }, ...keptMessages];
};

// === Fetch Available Models Dynamically ===
export const fetchModelsForProvider = async (provider: Provider, apiKey: string): Promise<OpenRouterModel[]> => {
  if (!apiKey && provider !== 'openrouter') {
      throw new Error("API Key requerida para obtener modelos");
  }

  try {
    let url = "";
    let headers: any = { "Content-Type": "application/json" };
    
    if (provider === 'openrouter') {
        if (apiKey) {
            const authCheck = await fetch("https://openrouter.ai/api/v1/auth/key", {
                method: "GET",
                headers: { "Authorization": `Bearer ${apiKey}` }
            });
            if (!authCheck.ok) {
                throw new Error("API Key de OpenRouter inválida o expirada");
            }
        } else {
             throw new Error("API Key requerida");
        }

        url = "https://openrouter.ai/api/v1/models";
        headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (provider === 'openai') {
        url = "https://api.openai.com/v1/models";
        headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (provider === 'groq') {
        url = "https://api.groq.com/openai/v1/models";
        headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (provider === 'gemini') {
        url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    }

    const response = await fetch(url, { method: "GET", headers: provider === 'gemini' ? {} : headers });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let models: OpenRouterModel[] = [];

    if (provider === 'gemini') {
        if (data.models && Array.isArray(data.models)) {
            models = data.models.map((m: any) => ({
                id: m.name.replace('models/', ''), 
                name: m.displayName || m.name,
                description: m.description
            }));
        }
    } else {
        const list = data.data || data;
        if (Array.isArray(list)) {
            models = list.map((m: any) => ({
                id: m.id,
                name: m.name || m.id,
                pricing: m.pricing
            }));
        }
    }

    return models.sort((a, b) => a.name.localeCompare(b.name));

  } catch (error: any) {
    console.error(`Error fetching models for ${provider}:`, error);
    throw new Error(error.message || "Error de red");
  }
};

// === OpenAI Compatible Sender ===
const sendOpenAICompatible = async (
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[],
  title: string,
  maxOutputTokens?: number
): Promise<ChatResponse> => {
  const headers: any = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };

  if (baseUrl.includes('openrouter')) {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = title;
  }

  const body: any = {
    model: model,
    messages: messages,
    temperature: 0.7,
  };

  if (maxOutputTokens) {
    body.max_tokens = maxOutputTokens;
  }

  const response = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices?.[0]?.message?.content || "(Sin respuesta)",
    usage: data.usage 
  };
};

// === Gemini Sender ===
const sendGemini = async (
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: Message[],
  currentAgentId: 'A' | 'B',
  contextLimit: number,
  maxTokensConfig?: { enabled: boolean; limit: number }
): Promise<ChatResponse> => {
  const modelId = model.startsWith('models/') ? model : `models/${model}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${apiKey}`;

  let contentsToProcess = history.filter(m => m.sender !== 'System');
  let effectiveSystemPrompt = systemPrompt;
  
  // 1. Check System Prompt
  const sysTokens = estimateTokens(systemPrompt);
  let currentBudget = 0;
    
  if (sysTokens > contextLimit) {
       const maxChars = contextLimit * 4;
       effectiveSystemPrompt = systemPrompt.substring(0, maxChars) + "... [Truncado]";
       currentBudget = estimateTokens(effectiveSystemPrompt);
  } else {
       currentBudget = sysTokens;
  }

  // 2. Filter history (Backwards)
  const keptParams: any[] = [];
  for (let i = contentsToProcess.length - 1; i >= 0; i--) {
      const msg = contentsToProcess[i];
      const t = estimateTokens(msg.text);
      if (currentBudget + t <= contextLimit) {
          keptParams.unshift(msg);
          currentBudget += t;
      } else {
          break;
      }
  }
  contentsToProcess = keptParams;

  const contents = contentsToProcess.map(msg => ({
    role: msg.sender === currentAgentId ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  const payload: any = {
    contents,
    generationConfig: {
      temperature: 0.7
    }
  };

  if (maxTokensConfig?.enabled) {
      payload.generationConfig.maxOutputTokens = maxTokensConfig.limit;
  }

  if (effectiveSystemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: effectiveSystemPrompt }]
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Gemini Error ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "(Sin respuesta)";
  
  const usage = data.usageMetadata ? {
    prompt_tokens: data.usageMetadata.promptTokenCount || 0,
    completion_tokens: data.usageMetadata.candidatesTokenCount || 0,
    total_tokens: data.usageMetadata.totalTokenCount || 0
  } : undefined;

  return { content: text, usage };
};


// === Main Router Function ===
export const sendMessageToOpenRouter = async (
  apiKey: string,
  model: string,
  systemPrompt: string,
  history: Message[],
  currentAgentId: 'A' | 'B',
  provider: Provider = 'openrouter',
  contextLimit: number,
  maxTokensConfig?: { enabled: boolean; limit: number }
): Promise<ChatResponse> => {
  if (!apiKey) throw new Error("API Key faltante");

  const isOutputLimitEnabled = maxTokensConfig?.enabled || false;
  const outputLimit = maxTokensConfig?.limit;
  const effectiveSystemPrompt = systemPrompt;

  // Prepare messages with Dynamic Context Pruning
  let openAIMessages: OpenRouterMessage[];
  
  if (provider !== 'gemini') {
      openAIMessages = pruneHistory(effectiveSystemPrompt, history, currentAgentId, contextLimit);
  } else {
      openAIMessages = []; // Not used for Gemini
  }

  switch (provider) {
    case 'openrouter':
      return sendOpenAICompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        apiKey,
        model,
        openAIMessages,
        "Nodemat Contest",
        isOutputLimitEnabled ? outputLimit : undefined
      );
    
    case 'openai':
      return sendOpenAICompatible(
        "https://api.openai.com/v1/chat/completions",
        apiKey,
        model,
        openAIMessages,
        "Nodemat Contest",
        isOutputLimitEnabled ? outputLimit : undefined
      );

    case 'groq':
      return sendOpenAICompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        apiKey,
        model,
        openAIMessages,
        "Nodemat Contest",
        isOutputLimitEnabled ? outputLimit : undefined
      );

    case 'gemini':
      return sendGemini(
          apiKey, 
          model, 
          effectiveSystemPrompt, 
          history, 
          currentAgentId, 
          contextLimit,
          maxTokensConfig
      );

    default:
      throw new Error(`Proveedor no soportado: ${provider}`);
  }
};
