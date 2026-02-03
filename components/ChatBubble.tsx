import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, AgentConfig } from '../types';
import { Bot, User, AlertCircle } from 'lucide-react';

interface Props {
  message: Message;
  agentA: AgentConfig;
  agentB: AgentConfig;
}

const ChatBubble: React.FC<Props> = ({ message, agentA, agentB }) => {
  const isAgentA = message.sender === 'A';
  const isSystem = message.sender === 'System';
  const agent = isAgentA ? agentA : agentB;
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-4 opacity-70">
        <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded-full border border-slate-700">
          {message.text}
        </span>
      </div>
    );
  }

  const alignClass = isAgentA ? 'justify-start' : 'justify-end';
  const bubbleColor = isAgentA 
    ? 'bg-gradient-to-br from-cyan-900/80 to-blue-900/80 border-cyan-700/50 text-cyan-50' 
    : 'bg-gradient-to-br from-purple-900/80 to-pink-900/80 border-purple-700/50 text-purple-50';
  
  const tailClass = isAgentA ? 'rounded-tl-none' : 'rounded-tr-none';

  return (
    <div className={`flex w-full mb-4 ${alignClass} group`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isAgentA ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border ${isAgentA ? 'bg-cyan-950 border-cyan-500 text-cyan-400' : 'bg-purple-950 border-purple-500 text-purple-400'}`}>
          <Bot className="w-5 h-5" />
        </div>

        {/* Bubble */}
        <div className={`relative px-4 py-3 rounded-2xl shadow-md border backdrop-blur-sm ${bubbleColor} ${tailClass} ${message.isError ? 'border-red-500 bg-red-900/50 text-red-100' : ''}`}>
           {/* Sender Name */}
           <div className={`text-[10px] font-bold mb-1 opacity-70 uppercase tracking-wider ${isAgentA ? 'text-left' : 'text-right'}`}>
              {agent.name} {message.isError && '(Error)'}
           </div>
           
           {/* Content */}
           <div className="text-sm leading-relaxed markdown-content">
             {message.isError ? (
               <div className="flex items-center gap-2">
                 <AlertCircle className="w-4 h-4" />
                 <span>{message.text}</span>
               </div>
             ) : (
                <ReactMarkdown>{message.text}</ReactMarkdown>
             )}
           </div>

           {/* Timestamp */}
           <div className={`text-[9px] mt-1 opacity-40 ${isAgentA ? 'text-left' : 'text-right'}`}>
             {new Date(message.timestamp).toLocaleTimeString()}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
