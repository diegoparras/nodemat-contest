
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
        <span className="bg-gray-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-3 py-1 rounded-full border border-gray-300 dark:border-slate-700 font-medium">
          {message.text}
        </span>
      </div>
    );
  }

  const alignClass = isAgentA ? 'justify-start' : 'justify-end';
  
  // Updated colors for better contrast in Light Mode while keeping Dark Mode aesthetic
  const bubbleColor = isAgentA 
    ? 'bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/80 dark:to-blue-900/80 border-cyan-200 dark:border-cyan-700/50 text-cyan-950 dark:text-cyan-50' 
    : 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/80 dark:to-pink-900/80 border-purple-200 dark:border-purple-700/50 text-purple-950 dark:text-purple-50';
  
  const tailClass = isAgentA ? 'rounded-tl-none' : 'rounded-tr-none';

  return (
    <div className={`flex w-full mb-6 ${alignClass} group`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isAgentA ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md border ${isAgentA ? 'bg-cyan-100 dark:bg-cyan-950 border-cyan-300 dark:border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'bg-purple-100 dark:bg-purple-950 border-purple-300 dark:border-purple-500 text-purple-600 dark:text-purple-400'}`}>
          <Bot className="w-5 h-5" />
        </div>

        {/* Bubble */}
        <div className={`relative px-5 py-4 rounded-2xl shadow-sm border ${bubbleColor} ${tailClass} ${message.isError ? 'border-red-500 bg-red-50 dark:bg-red-900/50 text-red-900 dark:text-red-100' : ''}`}>
           {/* Sender Name */}
           <div className={`text-[10px] font-bold mb-1 opacity-60 uppercase tracking-wider ${isAgentA ? 'text-left' : 'text-right'}`}>
              {agent.name} {message.isError && '(Error)'}
           </div>
           
           {/* Content with Markdown Rendering */}
           <div className={`text-sm leading-relaxed markdown-content`}>
             {message.isError ? (
               <div className="flex items-center gap-2">
                 <AlertCircle className="w-4 h-4" />
                 <span>{message.text}</span>
               </div>
             ) : (
               /* Using Tailwind Typography (prose) for nice markdown rendering */
               <div className={`
                  prose prose-sm max-w-none break-words
                  prose-headings:font-bold prose-headings:text-inherit
                  prose-p:text-inherit prose-p:my-1.5
                  prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline
                  prose-strong:font-bold prose-strong:text-inherit
                  prose-code:bg-black/10 dark:prose-code:bg-white/10 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-inherit prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-gray-900 dark:prose-pre:bg-black/50 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-3
                  prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4
                  prose-li:my-0.5
                  prose-table:border-collapse prose-th:border prose-th:border-black/20 dark:prose-th:border-white/20 prose-th:p-1 prose-td:border prose-td:border-black/10 dark:prose-td:border-white/10 prose-td:p-1
               `}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.text}
                  </ReactMarkdown>
               </div>
             )}
           </div>

           {/* Timestamp */}
           <div className={`text-[9px] mt-2 opacity-40 ${isAgentA ? 'text-left' : 'text-right'}`}>
             {new Date(message.timestamp).toLocaleTimeString()}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
