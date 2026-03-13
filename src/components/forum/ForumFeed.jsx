import React from "react";
import { Bot, ThumbsUp, MessageCircle, Zap, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusConfig = {
  approved: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Rejected" },
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Reviewing…" },
};

function PostCard({ post, user, onSelect, showStatus }) {
  const s = statusConfig[post.status] || statusConfig.pending;
  const StatusIcon = s.icon;
  const tags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <div
      onClick={() => onSelect(post.id)}
      className="group cursor-pointer bg-slate-800/60 border border-slate-700/50 hover:border-violet-500/50 rounded-2xl p-5 transition-all duration-300 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-violet-500/10"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-white group-hover:text-violet-300 transition-colors leading-snug flex-1">
          {post.title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {post.ai_approved && (
            <div className="flex items-center gap-1 bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5">
              <Bot className="w-3 h-3 text-violet-400" />
              <span className="text-xs text-violet-400 font-medium">AI ✓</span>
            </div>
          )}
          {showStatus && (
            <div className={`flex items-center gap-1 border rounded-full px-2 py-0.5 ${s.bg}`}>
              <StatusIcon className={`w-3 h-3 ${s.color}`} />
              <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">{post.content}</p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 5).map(tag => (
            <span key={tag} className="text-xs bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded-full">#{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />{post.upvotes || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />discuss
          </span>
          <span className="text-slate-600">{post.author_name || post.author_email?.split("@")[0] || "Anonymous"}</span>
        </div>
        <div className="flex items-center gap-2">
          {(post.xp_reward || 0) > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/10 rounded-full px-2 py-0.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-400 font-bold">+{post.xp_reward} XP</span>
            </div>
          )}
          <span className="text-xs text-slate-600">
            {post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true }) : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ForumFeed({ posts, isLoading, user, onSelectPost, showStatus = false }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-slate-800/40 rounded-2xl h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-slate-400 font-medium">No posts yet</p>
        <p className="text-slate-600 text-sm mt-1">Be the first to ask a Socratic question!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map(post => (
        <PostCard key={post.id} post={post} user={user} onSelect={onSelectPost} showStatus={showStatus} />
      ))}
    </div>
  );
}