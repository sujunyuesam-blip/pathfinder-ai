import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export default function ErrorBookTable({ errors, onToggleReview }) {
  if (!errors || errors.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg">No errors recorded yet</p>
        <p className="text-sm mt-1">Complete practice questions and submit answers to see errors here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="text-xs font-semibold w-24">Date</TableHead>
            <TableHead className="text-xs font-semibold">Question (Condensed)</TableHead>
            <TableHead className="text-xs font-semibold w-24">Your Ans</TableHead>
            <TableHead className="text-xs font-semibold w-24">Correct</TableHead>
            <TableHead className="text-xs font-semibold">Error Reason</TableHead>
            <TableHead className="text-xs font-semibold">Core Test Point</TableHead>
            <TableHead className="text-xs font-semibold w-20">Type</TableHead>
            <TableHead className="text-xs font-semibold w-20">Review</TableHead>
            <TableHead className="text-xs font-semibold w-16"># Errors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errors.map((err, idx) => (
            <TableRow key={err.id || idx} className="hover:bg-slate-50/50">
              <TableCell className="text-xs text-slate-500">{err.error_date || '-'}</TableCell>
              <TableCell className="text-xs text-slate-700 max-w-[200px] truncate">
                {err.question_condensed || err.original_question?.substring(0, 100)}
              </TableCell>
              <TableCell className="text-xs font-mono text-red-600">{err.user_answer}</TableCell>
              <TableCell className="text-xs font-mono text-emerald-600">{err.correct_answer}</TableCell>
              <TableCell className="text-xs text-slate-600 max-w-[150px]">{err.error_reason}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {err.core_test_point}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={err.question_type === 'basic' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}>
                  {err.question_type === 'basic' ? 'DR' : 'AS'}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Checkbox
                  checked={err.review_completed}
                  onCheckedChange={() => onToggleReview?.(err)}
                />
              </TableCell>
              <TableCell className="text-xs text-center font-semibold text-slate-700">
                {err.error_count || 1}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}