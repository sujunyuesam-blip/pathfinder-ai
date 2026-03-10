import React from "react";
import { useLang } from "../components/LanguageContext";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookMarked, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ErrorBookTable from "../components/learning/ErrorBookTable";

export default function ErrorBook() {
  const [filter, setFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const queryClient = useQueryClient();

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.LearningPlan.list('-created_date', 1),
    initialData: []
  });
  const plan = plans[0];

  const { data: errors, isLoading } = useQuery({
    queryKey: ['errors', plan?.id],
    queryFn: () => base44.entities.ErrorBookEntry.filter({ plan_id: plan?.id }, '-created_date', 500),
    enabled: !!plan,
    initialData: []
  });

  const handleToggleReview = async (error) => {
    await base44.entities.ErrorBookEntry.update(error.id, {
      review_completed: !error.review_completed
    });
    queryClient.invalidateQueries({ queryKey: ['errors'] });
  };

  const filteredErrors = errors.filter(e => {
    if (filter === "unreviewed" && e.review_completed) return false;
    if (filter === "reviewed" && !e.review_completed) return false;
    if (typeFilter === "basic" && e.question_type !== "basic") return false;
    if (typeFilter === "advanced" && e.question_type !== "advanced") return false;
    return true;
  });

  // Group errors by core test point
  const errorsByPoint = {};
  errors.forEach(e => {
    if (!errorsByPoint[e.core_test_point]) errorsByPoint[e.core_test_point] = 0;
    errorsByPoint[e.core_test_point]++;
  });
  const topPoints = Object.entries(errorsByPoint).sort(([,a],[,b]) => b - a).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => window.location.href = createPageUrl("Dashboard")}
            className="text-slate-500 gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-red-500" />
            <h1 className="text-xl font-bold text-slate-800">Error Book</h1>
            <Badge variant="outline">{errors.length} total</Badge>
          </div>
        </div>

        {/* High frequency error points */}
        {topPoints.length > 0 && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">
                ⚠️ High-Frequency Error-Prone Knowledge Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topPoints.map(([point, count]) => (
                  <Badge key={point} variant="outline" className="border-red-200 text-red-700 bg-red-50">
                    {point} ({count}×)
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unreviewed">Unreviewed</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="basic">Basic (DR)</SelectItem>
              <SelectItem value="advanced">Advanced (AS)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <ErrorBookTable
              errors={filteredErrors}
              onToggleReview={handleToggleReview}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}