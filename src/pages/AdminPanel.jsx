import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Users, BookOpen, Zap, Calendar, Trophy, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function CopyId({ id }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-mono transition-colors">
      {copied ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      <span className="truncate max-w-[120px]">{id}</span>
    </button>
  );
}

export default function AdminPanel() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['all-plans'],
    queryFn: () => base44.entities.LearningPlan.list('-created_date', 200),
    initialData: []
  });

  const { data: records } = useQuery({
    queryKey: ['all-records'],
    queryFn: () => base44.entities.CheckInRecord.list('-created_date', 500),
    initialData: []
  });

  const { data: convList } = useQuery({
    queryKey: ['all-conversations'],
    queryFn: () => base44.agents.listConversations({ agent_name: "learning_guide" }),
    initialData: []
  });

  // Group plans by user (created_by)
  const userMap = {};
  plans.forEach(plan => {
    const user = plan.created_by || "unknown";
    if (!userMap[user]) userMap[user] = { email: user, plans: [], totalDays: 0 };
    userMap[user].plans.push(plan);
  });

  // Attach record stats to users
  records.forEach(rec => {
    if (rec.created_by && userMap[rec.created_by]) {
      if (rec.status === 'completed') userMap[rec.created_by].totalDays++;
    }
  });

  const users = Object.values(userMap).sort((a, b) => b.plans.length - a.plans.length);

  // Group conversations by user
  const convByUser = {};
  (Array.isArray(convList) ? convList : []).forEach(conv => {
    const user = conv.created_by || "unknown";
    if (!convByUser[user]) convByUser[user] = [];
    convByUser[user].push(conv);
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => window.location.href = createPageUrl("Dashboard")} className="text-slate-500 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-slate-600" /> Admin Panel
            </h1>
            <p className="text-sm text-slate-500">{users.length} users · {plans.length} learning plans</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Users", value: users.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Learning Plans", value: plans.length, icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Agent Sessions", value: (Array.isArray(convList) ? convList : []).length, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Completed Days", value: records.filter(r => r.status === 'completed').length, icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Users & Learning Plans</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400">Loading...</div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No users found</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {users.map((user, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                            {user.email[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">{user.plans.length} plan(s)</span>
                              <span className="text-xs text-slate-300">·</span>
                              <span className="text-xs text-emerald-600 font-medium">{user.totalDays} days done</span>
                              {convByUser[user.email] && (
                                <>
                                  <span className="text-xs text-slate-300">·</span>
                                  <span className="text-xs text-violet-600 font-medium">
                                    {convByUser[user.email].length} AI session(s)
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Plans for this user */}
                        <div className="ml-10 space-y-1.5 mt-2">
                          {user.plans.map(plan => (
                            <div key={plan.id} className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg p-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-medium text-slate-700 truncate">{plan.program_name}</p>
                                  <Badge className={`text-xs flex-shrink-0 ${
                                    plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                    plan.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {plan.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="text-xs text-slate-400">Day {plan.current_day} · {plan.total_duration}</span>
                                  <CopyId id={plan.id} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs font-mono">
                          ID: {user.email.split('@')[0]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Conversations */}
        {Array.isArray(convList) && convList.length > 0 && (
          <Card className="border-0 shadow-sm mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-600" /> Agent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {convList.slice(0, 50).map((conv, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{conv.metadata?.name || "Untitled Session"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400">{conv.created_by || "unknown"}</p>
                        <CopyId id={conv.id} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{conv.messages?.length || 0} msgs</span>
                      <span className="text-xs text-slate-300">{conv.created_date ? new Date(conv.created_date).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}