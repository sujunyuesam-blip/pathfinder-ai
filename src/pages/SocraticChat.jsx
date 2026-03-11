import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Sparkles, RotateCcw, ArrowLeft, BookOpen, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { createPageUrl } from "@/utils";

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  if (!message.content) return null;
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-violet-600" />
        </div>
      )}
      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-slate-800 text-white rounded-br-sm"
          : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm shadow-sm"
      }`}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-1.5">{children}</p>,
              ul: ({ children }) => <ul className="my-1.5 ml-4 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="my-1.5 ml-4 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
              h3: ({ children }) => <h3 className="font-semibold text-slate-800 mt-3 mb-1">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-3 border-violet-300 pl-3 my-2 text-slate-500 italic bg-violet-50 rounded-r py-1">{children}</blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-xs">{children}</code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-semibold text-slate-500">
          You
        </div>
      )}
    </div>
  );
}

const PHILOSOPHY_TIPS = [
  "💡 The guide won't give you the answer — it'll help you discover it yourself.",
  "🔁 Each step has multiple dialogues. Take your time at each level.",
  "📊 Expect a progress report every few exchanges to track where you are.",
  "🌱 When you spot a flaw in the AI's suggestion, that's level progression.",
  "🗺️ You'll end with a factor-relationship map of everything you discovered.",
];

export default function SocraticChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.LearningPlan.list('-created_date', 5),
    initialData: []
  });

  const activePlan = plans.find(p => p.status === 'active');

  useEffect(() => {
    const interval = setInterval(() => setTipIndex(i => (i + 1) % PHILOSOPHY_TIPS.length), 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (plans.length > 0 || !initializing) {
      initConversation();
    }
  }, [plans]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    setInitializing(true);
    const conv = await base44.agents.createConversation({
      agent_name: "learning_guide",
      metadata: { name: `Socratic Session`, plan_id: activePlan?.id }
    });

    const contextMsg = activePlan
      ? `Context: The user is studying "${activePlan.program_name}". Current foundation: "${activePlan.current_foundation}". Day ${activePlan.current_day} of ${activePlan.total_duration}. Goals: min="${activePlan.minimum_goal}", sprint="${activePlan.sprint_goal}". Greet the user warmly, briefly explain your Socratic co-evolution philosophy (that both of you will grow together through dialogue — no upper limit), then ask what specific concept or difficulty from their studies they'd like to explore today.`
      : `Greet the user warmly. Briefly explain your Socratic co-evolution philosophy — that through structured dialogue, both the AI and user grow together with no upper limit. Ask what subject or difficulty they'd like to explore.`;

    const updated = await base44.agents.addMessage(conv, { role: "user", content: contextMsg });
    setConversation(updated);
    setMessages((updated?.messages || []).filter(m => !(m.role === "user" && m.content?.startsWith("Context:"))));
    setInitializing(false);

    const unsubscribe = base44.agents.subscribeToConversation(updated.id, (data) => {
      setMessages((data?.messages || []).filter(m => !(m.role === "user" && m.content?.startsWith("Context:"))));
    });
    return () => unsubscribe();
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const updated = await base44.agents.addMessage(conversation, { role: "user", content: text });
      setConversation(updated);
    } catch (e) {
      // Conversation no longer exists — reinitialize
      await initConversation();
    }
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetChat = () => {
    setConversation(null);
    setMessages([]);
    setInitializing(true);
    initConversation();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = createPageUrl("Dashboard")}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Socratic Learning Guide</p>
              <p className="text-xs text-slate-400">
                {activePlan ? activePlan.program_name : "Co-evolution through dialogue"}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New session
        </button>
      </div>

      {/* Philosophy tip banner */}
      <div className="bg-violet-50 border-b border-violet-100 px-4 py-2 text-center">
        <p className="text-xs text-violet-600 transition-all">{PHILOSOPHY_TIPS[tipIndex]}</p>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden max-w-5xl mx-auto w-full">
        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {initializing ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-violet-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-700">Preparing your Socratic Guide</p>
                  <p className="text-sm text-slate-400 mt-1">Calibrating to your learning level...</p>
                </div>
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              </div>
            ) : (
              messages.map((msg, i) => <MessageBubble key={i} message={msg} />)
            )}
            {sending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Share your thoughts, ask a question, or challenge an idea..."
                rows={2}
                className="flex-1 resize-none text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-300 max-h-32"
                disabled={initializing}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || sending || initializing}
                className="bg-violet-600 hover:bg-violet-700 text-white h-11 w-11 p-0 rounded-xl flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>

        {/* Sidebar — 4 steps guide */}
        <div className="hidden lg:block w-72 border-l border-slate-100 bg-white p-5 overflow-y-auto flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            <h3 className="font-semibold text-slate-700 text-sm">Mathematical Modeling Steps</h3>
          </div>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Problem Analysis",
                desc: "Clearly define what the real question is — not the surface symptom, but the root problem.",
                color: "bg-blue-50 border-blue-200 text-blue-700"
              },
              {
                step: "2",
                title: "Factor Analysis",
                desc: "Identify candidate factors. Choose which ones matter. Add your own. The guide introduces them gradually.",
                color: "bg-emerald-50 border-emerald-200 text-emerald-700"
              },
              {
                step: "3",
                title: "Basic Assumptions",
                desc: "State simplifying assumptions explicitly. Accept, reject, or refine each one together.",
                color: "bg-amber-50 border-amber-200 text-amber-700"
              },
              {
                step: "4",
                title: "Model Establishment",
                desc: "Build a conceptual model or recommendation together, grounded in all prior steps.",
                color: "bg-violet-50 border-violet-200 text-violet-700"
              }
            ].map(s => (
              <div key={s.step} className={`border rounded-xl p-3 ${s.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold">{s.step}</span>
                  <span className="font-semibold text-sm">{s.title}</span>
                </div>
                <p className="text-xs opacity-80">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Core Philosophy</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              AI cannot empower humans — humans empower AI. Through dialogue, both grow together from Level N to N+1, with no upper limit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}