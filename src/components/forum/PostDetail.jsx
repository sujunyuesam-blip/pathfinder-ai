import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Bot, ThumbsUp, Send, Loader2, Zap, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { buildParticipateInDiscussionPrompt } from "../learning/PromptEngine";

function Comment({ comment, user, onUpvote }) {
  const hasUpvoted = Array.isArray(comment.upvoted_by) && user?.email && comment.upvoted_by.includes(user.email);
  return (
    <div className={`flex gap-3 ${comment.is_ai
      ? "bg-violet-900/20 border border-violet-500/20 rounded-2xl p-4"
      : "py-3 border-b border-slate-700/30 last:border-0"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
        comment.is_ai ? "bg-violet-600" : "bg-slate-700 text-slate-300"
      }`}>
        {comment.is_ai ? <Bot className="w-4 h-4 text-white" /> : (comment.author_name || "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">
            {comment.is_ai ? "Socratic AI" : (comment.author_name || "Anonymous")}
          </span>
          {comment.is_ai && (
            <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">AI Guide</span>
          )}
          <span className="text-xs text-slate-600 ml-auto">
            {comment.created_date ? formatDistanceToNow(new Date(comment.created_date), { addSuffix: true }) : ""}
          </span>
        </div>
        <div className="text-slate-300 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{comment.content}</ReactMarkdown>
        </div>
        <button
          onClick={() => onUpvote(comment)}
          className={`mt-2 flex items-center gap-1.5 text-xs transition-colors ${
            hasUpvoted ? "text-violet-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />{comment.upvotes || 0}
        </button>
      </div>
    </div>
  );
}

export default function PostDetail({ postId, user, onBack }) {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiResponding, setAiResponding] = useState(false);
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  const { data: post } = useQuery({
    queryKey: ["forum_post", postId],
    queryFn: async () => {
      const res = await base44.entities.ForumPost.filter({ id: postId });
      return res[0] || null;
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["forum_comments", postId],
    queryFn: () => base44.entities.ForumComment.filter({ post_id: postId }, "created_date", 100),
  });

  const handleUpvotePost = async () => {
    if (!user || !post) return;
    const upvoted_by = Array.isArray(post.upvoted_by) ? post.upvoted_by : [];
    if (upvoted_by.includes(user.email)) return;
    await base44.entities.ForumPost.update(postId, {
      upvotes: (post.upvotes || 0) + 1,
      upvoted_by: [...upvoted_by, user.email]
    });
    qc.invalidateQueries({ queryKey: ["forum_post", postId] });
    qc.invalidateQueries({ queryKey: ["forum_posts_approved"] });
  };

  const handleUpvoteComment = async (comment) => {
    if (!user) return;
    const upvoted_by = Array.isArray(comment.upvoted_by) ? comment.upvoted_by : [];
    if (upvoted_by.includes(user.email)) return;
    await base44.entities.ForumComment.update(comment.id, {
      upvotes: (comment.upvotes || 0) + 1,
      upvoted_by: [...upvoted_by, user.email]
    });
    qc.invalidateQueries({ queryKey: ["forum_comments", postId] });
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    const text = newComment;
    setNewComment("");

    await base44.entities.ForumComment.create({
      post_id: postId,
      content: text,
      author_email: user?.email || "anonymous",
      author_name: user?.full_name || user?.email?.split("@")[0] || "Anonymous",
      is_ai: false,
      upvotes: 0,
      upvoted_by: []
    });
    qc.invalidateQueries({ queryKey: ["forum_comments", postId] });
    setSubmitting(false);

    // AI joins the discussion ~60% of the time
    if (Math.random() > 0.4 && post) {
      setAiResponding(true);
      try {
        const ctx = comments.slice(-4).map(c => `${c.is_ai ? "AI" : c.author_name}: ${c.content}`).join("\n");
        const aiReply = await base44.integrations.Core.InvokeLLM({
          prompt: buildParticipateInDiscussionPrompt(post, ctx, user, text),
          model: "claude_sonnet_4_6"
        });
        await base44.entities.ForumComment.create({
          post_id: postId,
          content: aiReply,
          author_email: "ai@system",
          author_name: "Socratic AI",
          is_ai: true,
          upvotes: 0,
          upvoted_by: []
        });
        qc.invalidateQueries({ queryKey: ["forum_comments", postId] });
      } catch (_) {}
      setAiResponding(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length, aiResponding]);

  if (!post) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );

  const hasUpvoted = Array.isArray(post.upvoted_by) && user?.email && post.upvoted_by.includes(user.email);
  const tags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back to Forum</span>
        </button>

        {/* Post */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-bold text-white leading-snug flex-1">{post.title}</h1>
            {(post.xp_reward || 0) > 0 && (
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 shrink-0">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm text-amber-400 font-bold">+{post.xp_reward} XP</span>
              </div>
            )}
          </div>

          <div className="text-slate-300 leading-relaxed mb-4 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tags.map(tag => (
                <span key={tag} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <span className="text-sm text-slate-400">{post.author_name || "Anonymous"}</span>
            <button
              onClick={handleUpvotePost}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${
                hasUpvoted
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
              }`}
            >
              <ThumbsUp className="w-4 h-4" />{post.upvotes || 0}
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />Discussion ({comments.length})
          </h3>
          <div className="space-y-1">
            {comments.map(c => (
              <Comment key={c.id} comment={c} user={user} onUpvote={handleUpvoteComment} />
            ))}
          </div>
          {aiResponding && (
            <div className="flex gap-3 bg-violet-900/20 border border-violet-500/20 rounded-2xl p-4 mt-2">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2 text-violet-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Socratic AI is thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 sticky bottom-4">
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleSubmit(); }}
            placeholder="Share your thoughts, challenge an assumption, or ask a follow-up… (Ctrl+Enter to send)"
            rows={3}
            className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-violet-500 resize-none mb-3"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!newComment.trim() || submitting}
              className="bg-violet-600 hover:bg-violet-700">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="ml-2">Reply</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}