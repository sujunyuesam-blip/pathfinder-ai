import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ForumFeed from "../components/forum/ForumFeed";
import SubmitPost from "../components/forum/SubmitPost";
import PostDetail from "../components/forum/PostDetail";
import { MessageSquare, Users, Plus, Flame, Trophy, Zap } from "lucide-react";

export default function SocraticForum() {
  const [tab, setTab] = useState("feed");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: approvedPosts = [], isLoading } = useQuery({
    queryKey: ["forum_posts_approved"],
    queryFn: () => base44.entities.ForumPost.filter({ status: "approved" }, "-created_date", 50),
  });

  const { data: myPosts = [] } = useQuery({
    queryKey: ["forum_posts_mine", user?.email],
    queryFn: () => base44.entities.ForumPost.filter({ author_email: user.email }, "-created_date", 20),
    enabled: !!user?.email,
  });

  if (selectedPostId) {
    return <PostDetail postId={selectedPostId} user={user} onBack={() => setSelectedPostId(null)} />;
  }

  const tabs = [
    { id: "feed", label: "Community Feed", icon: Users, count: approvedPosts.length },
    { id: "submit", label: "Ask the Forum", icon: Plus, count: null },
    { id: "mine", label: "My Posts", icon: MessageSquare, count: myPosts.length },
  ];

  // Leaderboard: top posts by upvotes
  const topPosts = [...approvedPosts].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Socratic Forum</h1>
                <p className="text-xs text-slate-400">AI-examined questions · Real community discussions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-400">{approvedPosts.length} live</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.count !== null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-white/20" : "bg-slate-700"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {tab === "feed" && (
              <ForumFeed posts={approvedPosts} isLoading={isLoading} user={user} onSelectPost={setSelectedPostId} />
            )}
            {tab === "submit" && (
              <SubmitPost user={user} onSuccess={() => setTab("mine")} />
            )}
            {tab === "mine" && (
              <ForumFeed posts={myPosts} isLoading={false} user={user} onSelectPost={setSelectedPostId} showStatus={true} />
            )}
          </div>

          {/* Sidebar - top posts leaderboard */}
          {tab === "feed" && topPosts.length > 0 && (
            <div className="w-64 shrink-0 hidden lg:block">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 sticky top-24">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />Top Questions
                </h3>
                <div className="space-y-3">
                  {topPosts.map((post, i) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPostId(post.id)}
                      className="w-full text-left p-3 bg-slate-700/40 hover:bg-slate-700/70 rounded-xl transition-colors group"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg font-black text-slate-600 w-5 shrink-0">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-300 group-hover:text-white line-clamp-2 transition-colors">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-xs text-amber-400">{post.upvotes || 0} votes</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}