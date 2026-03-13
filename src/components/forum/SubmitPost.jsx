import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bot, Zap, CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";

export default function SubmitPost({ user, onSuccess }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | examining | approved | rejected
  const [aiResult, setAiResult] = useState(null);
  const qc = useQueryClient();

  const examine = async () => {
    if (!title.trim() || !content.trim()) return;
    setPhase("examining");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI moderator for a Socratic learning forum. Examine the following post and decide if it is valuable and promotes genuine intellectual inquiry.

Criteria for approval:
- Promotes deep thinking or challenges assumptions
- Relevant to academics, critical thinking, or intellectual growth
- Has enough substance to spark real discussion
- Is NOT vague, spam, or off-topic

Post Title: "${title}"
Post Content: "${content}"

Respond in JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          approved: { type: "boolean" },
          reason: { type: "string" },
          xp_reward: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
          improved_title: { type: "string" }
        }
      },
      model: "claude_sonnet_4_6"
    });

    setAiResult(result);

    const postData = {
      title: result.approved ? (result.improved_title || title) : title,
      content,
      author_email: user?.email || "anonymous",
      author_name: user?.full_name || user?.email?.split("@")[0] || "Anonymous",
      source: "user_direct",
      ai_approved: result.approved,
      ai_review_note: result.reason,
      status: result.approved ? "approved" : "rejected",
      tags: result.tags || [],
      xp_reward: result.approved ? (result.xp_reward || 50) : 0,
      upvotes: 0,
      upvoted_by: []
    };

    await base44.entities.ForumPost.create(postData);
    qc.invalidateQueries({ queryKey: ["forum_posts_approved"] });
    qc.invalidateQueries({ queryKey: ["forum_posts_mine"] });
    setPhase(result.approved ? "approved" : "rejected");
  };

  if (phase === "approved") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Question Approved! 🎉</h2>
        <p className="text-slate-400 mb-5 max-w-md mx-auto">{aiResult?.reason}</p>
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-5 py-2.5 mb-8">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="text-amber-400 font-bold text-lg">+{aiResult?.xp_reward || 50} XP earned!</span>
        </div>
        <div>
          <Button onClick={() => { setPhase("idle"); setTitle(""); setContent(""); onSuccess(); }}
            className="bg-violet-600 hover:bg-violet-700 px-8">
            View in Community Feed →
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "rejected") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-24 h-24 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Not Quite Yet</h2>
        <p className="text-slate-300 mb-8 max-w-md mx-auto">{aiResult?.reason}</p>
        <Button onClick={() => setPhase("idle")} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 px-8">
          Revise & Resubmit
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* AI info banner */}
      <div className="bg-gradient-to-r from-violet-900/40 to-purple-900/40 border border-violet-500/20 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-violet-600/30 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-violet-300" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">AI Examination Engine</p>
            <p className="text-violet-300/70 text-xs">Powered by advanced AI · Socratic quality filter</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          Every post is examined for Socratic value. Approved questions earn XP and go live for the entire community to discuss — with real users <em>and</em> the AI.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {["Deep thinking", "Challenges assumptions", "Promotes discussion", "Academic relevance"].map(t => (
            <span key={t} className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full">{t}</span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">Your Question or Insight</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What fundamental question are you exploring?"
            className="bg-slate-800/60 border-slate-600 text-white placeholder-slate-500 focus:border-violet-500 h-11"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-300 mb-2 block">Expand Your Thinking</label>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Elaborate on your question. What assumptions are you challenging? What paradox have you found? What led you to this idea?"
            rows={6}
            className="bg-slate-800/60 border-slate-600 text-white placeholder-slate-500 focus:border-violet-500 resize-none"
          />
          <p className="text-xs text-slate-600 mt-1">{content.length} characters · The more depth, the better your chances of approval</p>
        </div>
        <Button
          onClick={examine}
          disabled={!title.trim() || !content.trim() || phase === "examining"}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 h-12 font-bold text-base shadow-lg shadow-violet-500/30 disabled:opacity-50"
        >
          {phase === "examining" ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />AI is examining your question…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Submit for AI Review</>
          )}
        </Button>
      </div>
    </div>
  );
}