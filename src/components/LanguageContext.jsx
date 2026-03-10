import React, { createContext, useContext, useState } from "react";

export const translations = {
  en: {
    appName: "LearnAgent",
    dashboard: "Dashboard",
    dailyCheckin: "Daily Check-in",
    errorBook: "Error Book",
    fullPlan: "Full Plan",
    newPlan: "+ New Learning Plan",
    setup: "Set Up Your Learning Plan",
    setupDesc: "Configure your study parameters and we'll generate a complete learning roadmap with daily check-ins",
    generating: "Generating...",
    goToDashboard: "Go to Dashboard →",
    noActivePlan: "No Active Learning Plan",
    noActivePlanDesc: "Set up your first learning plan to get started",
    createPlan: "Create Learning Plan",
    minimumGoal: "Minimum Goal",
    sprintGoal: "Sprint Goal",
    dailyTime: "Daily Time",
    startDate: "Start Date",
    daysStudied: "Days Studied",
    errorsToReview: "Errors to Review",
    recentCheckins: "Recent Check-ins",
    intensivePhase: "📘 Intensive Phase",
    conflictAvoidance: "🛡️ Conflict Avoidance",
    finalSprint: "🚀 Final Sprint",
    submitAnswers: "Submit your answers",
    viewGrading: "View grading results",
    generateNext: "Generate next day",
    startLearning: "Start today's learning",
    language: "中文",
    login: "Sign In",
    loginDesc: "Sign in to access your learning plans",
    loginBtn: "Sign In to Continue",
    loggingIn: "Signing in...",
  },
  zh: {
    appName: "学习助手",
    dashboard: "仪表盘",
    dailyCheckin: "每日打卡",
    errorBook: "错题本",
    fullPlan: "完整计划",
    newPlan: "+ 新建学习计划",
    setup: "设置你的学习计划",
    setupDesc: "配置你的学习参数，我们将生成完整的学习路线图和每日打卡内容",
    generating: "生成中...",
    goToDashboard: "前往仪表盘 →",
    noActivePlan: "暂无活跃学习计划",
    noActivePlanDesc: "创建你的第一个学习计划以开始使用",
    createPlan: "创建学习计划",
    minimumGoal: "最低目标",
    sprintGoal: "冲刺目标",
    dailyTime: "每日时长",
    startDate: "开始日期",
    daysStudied: "已学天数",
    errorsToReview: "待复习错题",
    recentCheckins: "最近打卡记录",
    intensivePhase: "📘 强化阶段",
    conflictAvoidance: "🛡️ 隔热阶段",
    finalSprint: "🚀 冲刺阶段",
    submitAnswers: "提交答案",
    viewGrading: "查看批改结果",
    generateNext: "生成下一天",
    startLearning: "开始今日学习",
    language: "English",
    login: "登录",
    loginDesc: "登录以访问你的学习计划",
    loginBtn: "立即登录",
    loggingIn: "登录中...",
  },
};

const LanguageContext = createContext({ lang: "en", t: translations.en, toggleLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("lang") || "en"; } catch { return "en"; }
  });

  const toggleLang = () => {
    const next = lang === "en" ? "zh" : "en";
    setLang(next);
    try { localStorage.setItem("lang", next); } catch {}
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}