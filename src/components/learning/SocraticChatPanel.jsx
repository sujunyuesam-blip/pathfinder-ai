import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Maximize2, Send, Loader2, Sparkles, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { createPageUrl } from "@/utils";

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="w-3 h-3 text-violet-600" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
        isUser
          ? "bg-slate-800 text-white rounded-br-sm"
          : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm shadow-sm"
      }`}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:my-1 prose-ul:my-1 prose-li:my-0"
            components={{
              p: ({ children }) => <p className="my-1">{children}</p>,
              ul: ({ children }) => <ul className="my-1 ml-3 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="my-1 ml-3 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-violet-300 pl-2 my-1 text-slate-500 italic">{children}</blockquote>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function SocraticChatPanel({ activePlan }) {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (open && !conversation) {
      startConversation();
    }
  }, [open]);

  const startConversation = async () => {
    setInitializing(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "learning_guide",
        metadata: {
          name: `Socratic Guide — ${activePlan?.program_name || "Learning"}`,
          plan_id: activePlan?.id,
        }
      });
      setConversation(conv);

      // Send context-priming first message
      const contextMsg = activePlan
        ? `Context: The user is studying "${activePlan.program_name}". Their current foundation: "${activePlan.current_foundation}". They are on Day ${activePlan.current_day} of a ${activePlan.total_duration} plan. Their minimum goal: "${activePlan.minimum_goal}". Greet the user warmly, briefly explain your Socratic co-evolution approach (that you'll grow together with them), then ask what specific concept or difficulty they'd like to explore today.`
        : `Greet the user warmly. Briefly explain your Socratic co-evolution approach, then ask what subject or difficulty they'd like to explore.`;

      const updated = await base44.agents.addMessage(conv, {
        role: "user",
        content: contextMsg,
      });

      setConversation(updated);
      setMessages((updated?.messages || []).filter(m => m.role !== "user" || !m.content?.startsWith("Context:")));

      try {
        const unsubscribe = base44.agents.subscribeToConversation(updated.id, (data) => {
          setMessages((data?.messages || []).filter(m => m.role !== "user" || !m.content?.startsWith("Context:")));
        });
        return () => unsubscribe();
      } catch (e) {
        console.warn("Subscription failed:", e);
      }
    } catch (e) {
      console.warn("Failed to start conversation, resetting:", e);
      setConversation(null);
      setMessages([]);
    } finally {
      setInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const updated = await base44.agents.addMessage(conversation, {
        role: "user",
        content: text,
      });
      setConversation(updated);
    } catch (e) {
      // Conversation no longer exists — reinitialize
      console.warn("Conversation stale, reinitializing:", e);
      setConversation(null);
      setMessages([]);
      setSending(false);
      await startConversation();
      return;
    }
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const resetChat = async () => {
    setConversation(null);
    setMessages([]);
    setOpen(false);
    setTimeout(() => setOpen(true), 100);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] md:w-[420px] h-[580px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Socratic Guide</p>
                <p className="text-violet-200 text-xs">Co-evolving with you, step by step</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="New conversation"
              >
                <RotateCcw className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => window.location.href = createPageUrl("SocraticChat")}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Open full screen"
              >
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {(initializing || messages.length === 0) && !initializing ? (
              <div className="text-center text-slate-400 text-xs pt-8">Starting conversation...</div>
            ) : initializing ? (
              <div className="flex justify-center pt-8">
                <div className="flex items-center gap-2 text-violet-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing your guide...
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                msg.content && <MessageBubble key={i} message={msg} />
              ))
            )}
            {sending && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="w-3 h-3 text-violet-600" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Share your thoughts or ask a question..."
                rows={1}
                className="flex-1 resize-none text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 max-h-24 overflow-y-auto"
                style={{ minHeight: '38px' }}
                disabled={initializing}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || sending || initializing}
                className="bg-violet-600 hover:bg-violet-700 text-white h-9 w-9 p-0 rounded-xl flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}