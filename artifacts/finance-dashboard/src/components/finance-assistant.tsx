import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { processMessage, SUGGESTED_QUESTIONS } from "@/lib/assistant-logic";
import type { ChatMessage } from "@/lib/assistant-logic";
import type { Transaction } from "@/lib/ai-insights";
import { useListTransactions } from "@workspace/api-client-react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  User,
  ChevronDown,
  Minus,
} from "lucide-react";

// Very simple markdown-bold renderer: **text** → <strong>
function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const timeStr = msg.timestamp.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end gap-2 items-end"
      >
        <div className="max-w-[78%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
            {msg.text}
          </div>
          <p className="text-[10px] text-muted-foreground text-right mt-1 mr-1">{timeStr}</p>
        </div>
        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mb-5">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
      </motion.div>
    );
  }

  // Multi-line assistant message with • bullets
  const lines = msg.text.split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2 items-end"
    >
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0 mb-5 shadow-sm">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="max-w-[82%]">
        <div className="glass-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed space-y-1">
          {lines.map((line, i) => {
            if (!line.trim()) return null;
            if (line.startsWith("• ")) {
              return (
                <p key={i} className="flex gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <RichText text={line.slice(2)} />
                </p>
              );
            }
            return (
              <p key={i}>
                <RichText text={line} />
              </p>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground ml-1 mt-1">{timeStr}</p>
      </div>
    </motion.div>
  );
}

export function FinanceAssistant() {
  const { data: rawTransactions = [] } = useListTransactions(
    { sortBy: "date", sortOrder: "asc" },
    { query: { queryKey: ["assistant-transactions"], staleTime: 30_000 } }
  );
  const transactions = rawTransactions as Transaction[];
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm your AI financial assistant. Ask me about your spending, savings, or predictions — or tap a suggestion below.",
      timestamp: new Date(),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, minimized, messages]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setTyping(true);

      // Simulate a brief thinking delay for realism
      setTimeout(() => {
        const reply = processMessage(trimmed, transactions);
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setTyping(false);
      }, 600);
    },
    [transactions]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const unreadCount = !open ? messages.filter((m) => m.role === "assistant").length - 1 : 0;

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={minimized ? { opacity: 1, scale: 1, y: 0, height: "auto" } : { opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed bottom-[88px] right-6 z-50 w-[340px] sm:w-[380px]"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          >
            <div className="glass-card border border-border/60 rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 flex flex-col"
              style={{ height: minimized ? "auto" : "520px", maxHeight: "calc(100vh - 120px)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/90 to-chart-2/80 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">AI Assistant</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <p className="text-[10px] text-white/70 font-medium">Online</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMinimized((m) => !m)}
                    className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    aria-label={minimized ? "Expand" : "Minimize"}
                  >
                    {minimized
                      ? <ChevronDown className="h-3.5 w-3.5 text-white rotate-180" />
                      : <Minus className="h-3.5 w-3.5 text-white" />
                    }
                  </button>
                  <button
                    onClick={() => { setOpen(false); setMinimized(false); }}
                    className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    aria-label="Close assistant"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </div>

              {!minimized && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} msg={msg} />
                    ))}

                    {/* Typing indicator */}
                    <AnimatePresence>
                      {typing && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex gap-2 items-end"
                        >
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Bot className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="glass-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3">
                            <div className="flex gap-1 items-center">
                              {[0, 0.15, 0.3].map((delay, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ y: [0, -4, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay, ease: "easeInOut" }}
                                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={bottomRef} />
                  </div>

                  {/* Suggested questions */}
                  <div className="px-3 pb-2 flex-shrink-0">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                      {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="flex-shrink-0 text-[10px] font-medium rounded-lg px-2.5 py-1.5 bg-primary/8 hover:bg-primary/15 text-primary border border-primary/15 transition-colors whitespace-nowrap"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input */}
                  <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2 px-3 pb-3 pt-1 flex-shrink-0 border-t border-border/50"
                  >
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about your finances..."
                      className="flex-1 h-9 rounded-xl bg-muted/60 border border-border/60 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
                      disabled={typing}
                      maxLength={300}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-9 w-9 rounded-xl flex-shrink-0 shadow-sm"
                      disabled={!input.trim() || typing}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setOpen((o) => !o); setMinimized(false); }}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-xl shadow-primary/30 flex items-center justify-center hover:shadow-2xl hover:shadow-primary/40 transition-shadow"
        aria-label="Open AI assistant"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Bot className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && !open && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"
            >
              <Sparkles className="h-3 w-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
