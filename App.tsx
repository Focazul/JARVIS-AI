import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Menu, X, BrainCircuit } from 'lucide-react';
import { createChatSession, initializeGemini } from './services/geminiService';
import { Alarm, Task, Message, ToolName } from './types';
import { ChatMessage } from './components/ChatMessage';
import { Dashboard } from './components/Dashboard';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  // --- State ---
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Olá. Sou JARVIS. Como posso ajudar com seus alarmes e tarefas hoje?',
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null); // Store Gemini Chat Session
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  
  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Gemini
  useEffect(() => {
    try {
      initializeGemini();
      const session = createChatSession();
      setChatSession(session);
    } catch (error) {
      console.error("Failed to init Gemini:", error);
      addMessage('system', 'Erro: API Key não configurada. Verifique as configurações.');
    }
  }, []);

  // --- Handlers ---

  const addMessage = (role: 'user' | 'model' | 'system', content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: generateId(), role, content, timestamp: Date.now() },
    ]);
  };

  // --- Tool Execution Logic ---

  const executeTool = (functionCall: any): { result: any; displayText?: string } => {
    const { name, args } = functionCall;
    console.log(`Executing tool: ${name}`, args);

    switch (name) {
      case ToolName.ADD_ALARM: {
        const newAlarm: Alarm = {
          id: generateId(),
          time: args.time,
          description: args.description,
          active: true,
        };
        setAlarms(prev => [...prev, newAlarm]);
        return { result: { success: true, alarmId: newAlarm.id }, displayText: `Alarme criado para ${args.time}.` };
      }
      case ToolName.LIST_ALARMS: {
        const activeAlarms = alarms.map(a => `${a.time} - ${a.description}`).join(', ');
        return { result: { alarms: alarms }, displayText: `Você tem ${alarms.length} alarmes: ${activeAlarms || 'nenhum'}` };
      }
      case ToolName.DELETE_ALARM: {
        const keyword = args.keyword.toLowerCase();
        const initialCount = alarms.length;
        // Simple filter based on simple matching
        const remainingAlarms = alarms.filter(a => 
            !a.id.includes(keyword) && 
            !a.description.toLowerCase().includes(keyword) &&
            !a.time.includes(keyword)
        );
        const deletedCount = initialCount - remainingAlarms.length;
        setAlarms(remainingAlarms);
        return { result: { deletedCount }, displayText: `${deletedCount} alarme(s) removido(s).` };
      }
      case ToolName.ADD_TASK: {
        const newTask: Task = {
          id: generateId(),
          title: args.title,
          date: args.date || 'Sem data',
          time: args.time,
          completed: false,
        };
        setTasks(prev => [...prev, newTask]);
        return { result: { success: true, taskId: newTask.id } };
      }
      case ToolName.LIST_TASKS: {
         return { result: { tasks: tasks } };
      }
      case ToolName.COMPLETE_TASK: {
        const keyword = args.keyword.toLowerCase();
        let found = false;
        setTasks(prev => prev.map(t => {
            if (t.title.toLowerCase().includes(keyword) || t.id === keyword) {
                found = true;
                return { ...t, completed: true };
            }
            return t;
        }));
        return { result: { success: found } };
      }
      case ToolName.DELETE_TASK: {
        const keyword = args.keyword.toLowerCase();
        const initialCount = tasks.length;
        const remainingTasks = tasks.filter(t => 
            !t.id.includes(keyword) && 
            !t.title.toLowerCase().includes(keyword)
        );
        const deletedCount = initialCount - remainingTasks.length;
        setTasks(remainingTasks);
        return { result: { deletedCount } };
      }
      default:
        return { result: { error: "Unknown tool" } };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatSession || isProcessing) return;

    const userText = inputValue;
    setInputValue('');
    addMessage('user', userText);
    setIsProcessing(true);

    try {
      // 1. Send message to model
      let response = await chatSession.sendMessage({ message: userText });
      let functionCalls = response.functionCalls;

      // 2. Loop until no more function calls (Model might call multiple tools or call, then speak)
      while (functionCalls && functionCalls.length > 0) {
        const toolResponses = [];
        
        // Execute all requested tools
        for (const call of functionCalls) {
           const execution = executeTool(call);
           toolResponses.push({
             functionResponse: {
                name: call.name,
                response: execution.result
             }
           });
        }

        // 3. Send tool results back to model
        response = await chatSession.sendMessage({ message: toolResponses });
        functionCalls = response.functionCalls;
      }

      // 4. Final text response
      const modelText = response.text;
      if (modelText) {
        addMessage('model', modelText);
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      addMessage('system', 'Desculpe, tive um problema ao processar sua solicitação.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Voice Logic (Simple Web Speech API) ---
  const toggleListening = () => {
    if (isListening) return; // Basic implementation: only start

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      // Optional: Auto-send after voice
      // handleSendMessage(); 
    };

    recognition.start();
  };


  // --- Render ---

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 overflow-hidden relative">
      
      {/* Background Decorative */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-cyan-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center relative shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <BrainCircuit size={24} className="text-cyan-400" />
            <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-20"></div>
          </div>
          <div>
            <h1 className="font-tech text-xl text-white tracking-wider">JARVIS</h1>
            <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-[10px] text-cyan-300 uppercase tracking-widest">Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowDashboard(!showDashboard)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors md:hidden text-cyan-400"
        >
          {showDashboard ? <X /> : <Menu />}
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showDashboard ? '-translate-x-full md:translate-x-0 hidden md:flex' : 'flex'}`}>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
             {isProcessing && (
                <div className="flex items-center gap-2 text-cyan-500/70 text-sm ml-12 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full delay-150"></span>
                    <span className="font-tech text-xs ml-2">PROCESSANDO...</span>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900/50 border-t border-slate-800 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-2 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite um comando (ex: 'Me acorde amanhã às 8h')"
                className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 focus:ring-0 resize-none max-h-32 p-3 text-base"
                rows={1}
                style={{minHeight: '48px'}}
              />
              <div className="flex items-center gap-1 pb-1 pr-1">
                <button
                  onClick={toggleListening}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500/20 text-red-500 animate-pulse' 
                      : 'hover:bg-slate-700 text-slate-400 hover:text-cyan-400'
                  }`}
                  title="Falar comando"
                >
                  <Mic size={20} />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-cyan-900/20"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Side Panel (Desktop: Always visible on right. Mobile: Toggle overlay) */}
        <div className={`
          absolute md:relative z-20 top-0 right-0 w-full md:w-80 h-full 
          bg-slate-900/95 md:bg-slate-900/50 border-l border-slate-800 backdrop-blur-xl md:backdrop-blur-none
          transform transition-transform duration-300 ease-in-out
          ${showDashboard ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
             <div className="h-full flex flex-col">
                <div className="md:hidden flex justify-end p-4 border-b border-slate-800">
                    <button onClick={() => setShowDashboard(false)} className="text-slate-400">
                        <X />
                    </button>
                </div>
                <Dashboard 
                    alarms={alarms} 
                    tasks={tasks}
                    onDeleteAlarm={(id) => setAlarms(prev => prev.filter(a => a.id !== id))}
                    onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
                    onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? {...t, completed: !t.completed} : t))}
                />
             </div>
        </div>

      </div>
    </div>
  );
}