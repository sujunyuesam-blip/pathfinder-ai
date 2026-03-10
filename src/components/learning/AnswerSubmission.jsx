import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, CheckCircle } from "lucide-react";

export default function AnswerSubmission({ onSubmit, loading, scenarioType }) {
  const isConflict = scenarioType === "conflict_avoidance";
  const basicCount = isConflict ? 10 : 10;
  const advancedCount = isConflict ? 0 : 5;

  const [basicAnswers, setBasicAnswers] = useState(Array(basicCount).fill(""));
  const [advancedAnswers, setAdvancedAnswers] = useState(Array(advancedCount).fill(""));

  const handleBasicChange = (index, value) => {
    const updated = [...basicAnswers];
    updated[index] = value;
    setBasicAnswers(updated);
  };

  const handleAdvancedChange = (index, value) => {
    const updated = [...advancedAnswers];
    updated[index] = value;
    setAdvancedAnswers(updated);
  };

  const handleSubmit = () => {
    const basicStr = basicAnswers.map((a, i) => `${i + 1}.${a}`).join(" ");
    const advancedStr = advancedAnswers.map((a, i) => `${i + 1}.${a}`).join(" ");
    
    let formatted = `DR/Basic: ${basicStr}`;
    if (!isConflict) {
      formatted += `\nAS/Advanced: ${advancedStr}`;
    }
    
    onSubmit({
      basic: basicStr,
      advanced: advancedStr,
      formatted
    });
  };

  const allBasicFilled = basicAnswers.some(a => a.trim() !== "");

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            {isConflict ? "Review Questions" : "Basic Minimum Questions (DR)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {basicAnswers.map((ans, i) => (
              <div key={i}>
                <Label className="text-xs text-slate-400 mb-1 block">Q{i + 1}</Label>
                <Input
                  value={ans}
                  onChange={(e) => handleBasicChange(i, e.target.value)}
                  placeholder={`${i + 1}`}
                  className="text-center font-mono border-slate-200 focus:border-slate-400"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!isConflict && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              Advanced Sprint Questions (AS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {advancedAnswers.map((ans, i) => (
                <div key={i}>
                  <Label className="text-xs text-slate-400 mb-1 block">Q{i + 1}</Label>
                  <Input
                    value={ans}
                    onChange={(e) => handleAdvancedChange(i, e.target.value)}
                    placeholder={`${i + 1}`}
                    className="text-center font-mono border-slate-200 focus:border-slate-400"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!allBasicFilled || loading}
        className="w-full bg-slate-800 hover:bg-slate-700 text-white gap-2 h-12"
      >
        <Send className="w-4 h-4" />
        {loading ? "Grading Answers..." : "Submit Answers for Grading"}
      </Button>
    </div>
  );
}