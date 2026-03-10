import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target, Shield, Clock, Calendar, ChevronRight, Zap } from "lucide-react";

const FIELD_CONFIG = [
  {
    key: "program_name",
    label: "Learning Program",
    icon: BookOpen,
    placeholder: "e.g. NEC Economics Competition, AP Macroeconomics, IB Mathematics AA HL, A-Level Chemistry AS",
    description: "Full name including exam system",
    type: "input"
  },
  {
    key: "current_foundation",
    label: "Current Foundation",
    icon: Zap,
    placeholder: "e.g. Completed AP Microeconomics full content, zero foundation, completed IGCSE core content",
    description: "What you've mastered, completed stages, current level",
    type: "textarea"
  },
  {
    key: "total_duration",
    label: "Planned Total Duration",
    icon: Calendar,
    placeholder: "e.g. 2 months (8 weeks), 3 months (12 weeks), 6 weeks",
    description: "Total preparation period, accurate to weeks/months",
    type: "input"
  },
  {
    key: "start_date",
    label: "Start Date",
    icon: Calendar,
    placeholder: "",
    description: "When do you want to start?",
    type: "date"
  },
  {
    key: "minimum_goal",
    label: "Minimum Goal",
    icon: Target,
    placeholder: "e.g. 100% coverage of DR Group test points, ≥85% daily accuracy, AP score of 5",
    description: "Definite, quantifiable minimum target matching official standards",
    type: "textarea"
  },
  {
    key: "sprint_goal",
    label: "Sprint Goal",
    icon: Target,
    placeholder: "e.g. 80% mastery of AS group advanced points, ≥75% accuracy, AP score of 5 in both subjects",
    description: "Clear, quantifiable elevated target (must be higher than minimum)",
    type: "textarea"
  },
  {
    key: "daily_available_minutes",
    label: "Daily Available Duration (minutes)",
    icon: Clock,
    placeholder: "e.g. 60",
    description: "Fixed daily study time, accurate to minutes",
    type: "number"
  }
];

export default function SetupForm({ onSubmit, loading }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    program_name: "",
    current_foundation: "",
    total_duration: "",
    start_date: new Date().toISOString().split('T')[0],
    minimum_goal: "",
    sprint_goal: "",
    conflict_avoidance_start: "",
    conflict_avoidance_end: "",
    conflict_reason: "",
    daily_available_minutes: 60
  });

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const isStepValid = () => {
    if (step < FIELD_CONFIG.length) {
      const field = FIELD_CONFIG[step];
      return form[field.key] !== "" && form[field.key] !== undefined;
    }
    return true; // conflict avoidance step is optional
  };

  const totalSteps = FIELD_CONFIG.length + 1; // +1 for conflict avoidance

  const handleSubmit = () => {
    onSubmit(form);
  };

  const renderField = (config) => {
    const Icon = config.icon;
    if (config.type === "textarea") {
      return (
        <Textarea
          value={form[config.key] || ""}
          onChange={(e) => handleChange(config.key, e.target.value)}
          placeholder={config.placeholder}
          className="min-h-[100px] text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400"
        />
      );
    }
    if (config.type === "date") {
      return (
        <Input
          type="date"
          value={form[config.key] || ""}
          onChange={(e) => handleChange(config.key, e.target.value)}
          className="text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400"
        />
      );
    }
    if (config.type === "number") {
      return (
        <Input
          type="number"
          min={10}
          max={480}
          value={form[config.key] || ""}
          onChange={(e) => handleChange(config.key, Number(e.target.value))}
          placeholder={config.placeholder}
          className="text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400"
        />
      );
    }
    return (
      <Input
        value={form[config.key] || ""}
        onChange={(e) => handleChange(config.key, e.target.value)}
        placeholder={config.placeholder}
        className="text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400"
      />
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-800 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {step < FIELD_CONFIG.length ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              {React.createElement(FIELD_CONFIG[step].icon, { className: "w-5 h-5 text-slate-600" })}
              <CardTitle className="text-xl font-semibold text-slate-800">
                {FIELD_CONFIG[step].label}
              </CardTitle>
            </div>
            <p className="text-sm text-slate-500">{FIELD_CONFIG[step].description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderField(FIELD_CONFIG[step])}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-slate-600" />
              <CardTitle className="text-xl font-semibold text-slate-800">
                Conflict Avoidance Period
              </CardTitle>
            </div>
            <p className="text-sm text-slate-500">
              Specify any time periods where you need to avoid intensive study (e.g., major exams, school events). Optional.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-600">Start Date</Label>
                <Input
                  type="date"
                  value={form.conflict_avoidance_start}
                  onChange={(e) => handleChange("conflict_avoidance_start", e.target.value)}
                  className="border-slate-200"
                />
              </div>
              <div>
                <Label className="text-sm text-slate-600">End Date</Label>
                <Input
                  type="date"
                  value={form.conflict_avoidance_end}
                  onChange={(e) => handleChange("conflict_avoidance_end", e.target.value)}
                  className="border-slate-200"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm text-slate-600">Reason</Label>
              <Input
                value={form.conflict_reason}
                onChange={(e) => handleChange("conflict_reason", e.target.value)}
                placeholder="e.g. AP major exam period, school mock exams"
                className="border-slate-200"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between mt-6">
        <Button
          variant="ghost"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="text-slate-500"
        >
          Back
        </Button>
        {step < totalSteps - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!isStepValid()}
            className="bg-slate-800 hover:bg-slate-700 text-white gap-2"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-white gap-2"
          >
            {loading ? "Generating Plan..." : "Generate Learning Plan"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}