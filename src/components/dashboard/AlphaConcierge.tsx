import { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AlphaConcierge = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const messages = [
    {
      type: "bot",
      text: "Welcome to Alpha Banking! 👋 I'm your personal concierge. How can I assist you today?",
      time: "09:45 AM"
    },
    {
      type: "bot",
      text: "I can help you with deposits, transfers, loan requests, or any questions about our services.",
      time: "09:45 AM"
    },
  ];

  return (
    <>
      {/* Floating Button - Premium Gold */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 ${isOpen ? 'hidden' : 'block'}`}
        style={{
          background: 'linear-gradient(145deg, #D4AF37, #8B7500)',
          boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
        }}
      >
        {/* Pulse Ring */}
        <span className="absolute inset-0 rounded-full bg-[#D4AF37]/30 pulse-ring" />
        <MessageCircle className="w-6 h-6 text-black relative z-10" />
      </button>

      {/* Chat Panel - Obsidian Theme */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 glass-card border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden bg-[#0d0d0d]">
          {/* Header */}
          <div 
            className="p-4 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #8B7500)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <h4 className="font-semibold text-black">Alpha Concierge</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                  <span className="text-xs text-black/70">Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-3 bg-[#0a0a0a]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.type === 'user' 
                    ? 'bg-[#D4AF37] text-black rounded-br-md' 
                    : 'bg-[#1a1a1a] text-foreground rounded-bl-md border border-[#D4AF37]/10'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.type === 'user' ? 'text-black/60' : 'text-muted-foreground'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#D4AF37]/20 bg-[#0d0d0d]">
            <div className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#1a1a1a] border-[#D4AF37]/20 focus-visible:ring-[#D4AF37]"
              />
              <Button 
                size="icon" 
                className="shrink-0"
                style={{
                  background: 'linear-gradient(145deg, #D4AF37, #8B7500)',
                }}
              >
                <Send className="w-4 h-4 text-black" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlphaConcierge;
