import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Calendar, Clock, ListChecks, Zap, Loader2, Info } from 'lucide-react';

interface Message { id: number; role: 'user' | 'ai'; text: string; timestamp: Date; }

const QUICK_PROMPTS = [
  { icon: <Calendar className="w-4 h-4" />, label: 'Plan my day', message: 'Help me plan my day based on my tasks.' },
  { icon: <Clock className="w-4 h-4" />, label: "What's next?", message: 'Based on my priorities, what should I work on next?' },
  { icon: <ListChecks className="w-4 h-4" />, label: 'Schedule tasks', message: 'Help me set due dates for my unscheduled Do First tasks.' },
  { icon: <Zap className="w-4 h-4" />, label: 'Time block review', message: 'Review my time blocks and suggest improvements.' },
];

const AIScheduling: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = (text: string) => {
    const userMsg: Message = { id: Date.now(), role: 'user', text: text.trim(), timestamp: new Date() };
    const aiMsg: Message = {
      id: Date.now() + 1, role: 'ai',
      text: '🚧 AI Scheduling is coming in Phase 2! This feature will connect directly to your Tasklet AI agent for real-time scheduling help. For now, use the main Tasklet chat to ask scheduling questions.',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="bg-primary/10 rounded-full p-4"><Sparkles className="w-10 h-10 text-primary" /></div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">AI Scheduling Assistant</h2>
              <p className="text-base-content/60 max-w-md">Ask me to help plan your day, schedule tasks, review priorities, or reorganize your time blocks.</p>
            </div>
            <div className="alert alert-info text-sm max-w-md py-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>Full AI integration is coming in Phase 2. For now, questions will show a placeholder response.</span>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button key={i} className="btn btn-outline btn-sm h-auto py-3 flex-col gap-1 normal-case text-left" onClick={() => sendMessage(prompt.message)}>
                  <span className="flex items-center gap-1.5 text-primary">{prompt.icon}<span className="font-medium">{prompt.label}</span></span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                <div className="chat-header text-xs text-base-content/40 mb-1">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                  <time className="ml-2">{msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
                </div>
                <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble'}`}>{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <div className="flex gap-2 items-center border-t border-base-300 pt-3">
        <label className="input input-bordered flex items-center gap-2 flex-1">
          <Sparkles className="h-[1em] opacity-50" />
          <input type="text" className="grow" placeholder="Ask me to help schedule, plan, or reorganize..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim()) sendMessage(input); } }} />
        </label>
        <button className="btn btn-primary btn-square" onClick={() => input.trim() && sendMessage(input)} disabled={!input.trim()}>
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AIScheduling;
