
import React, { useState, useRef, useEffect } from 'react';
import { generateAIResponse } from '../services/geminiService';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const result = await generateAIResponse(userMsg, history);
    setMessages(prev => [...prev, { role: 'model', text: result.text }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      {isOpen ? (
        <div className="bg-white w-[350px] h-[500px] rounded-[2.5rem] shadow-2xl border border-sky-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-sky-600 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Asistente</p>
                <p className="text-[10px] opacity-70">Malli Aquatic Club</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}><i className="fa-solid fa-xmark"></i></button>
          </div>

          <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 custom-scrollbar bg-sky-50/30">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <p className="text-stone-400 text-xs font-medium italic">¿En qué puedo ayudarte hoy?</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${m.role === 'user' ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-white text-stone-700 border border-sky-100 rounded-tl-none shadow-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl border border-sky-100 animate-pulse flex gap-1">
                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 bg-white border-t border-sky-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu duda..."
              className="flex-grow px-4 py-3 bg-stone-50 rounded-xl text-sm outline-none focus:ring-2 ring-sky-500/20"
            />
            <button type="submit" className="w-12 h-12 bg-sky-600 text-white rounded-xl flex items-center justify-center hover:bg-sky-700 transition-colors">
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-sky-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all animate-bounce"
        >
          <i className="fa-solid fa-comment-dots"></i>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
