import React from 'react';
import { Message } from '../types';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-blue-600' : 'bg-cyan-600'}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>
        <div
          className={`px-4 py-3 rounded-2xl text-sm md:text-base leading-relaxed ${
            isUser
              ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-br-none'
              : 'bg-cyan-900/20 border border-cyan-500/30 text-cyan-100 rounded-bl-none'
          }`}
        >
            {/* Render newlines properly */}
            {message.content.split('\n').map((line, i) => (
                <p key={i} className="min-h-[1em]">{line}</p>
            ))}
        </div>
      </div>
    </div>
  );
};
