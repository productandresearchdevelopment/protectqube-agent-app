export const getAIOpsBadgeClass = (color?: string): string => {
  switch (color) {
    case "amber":
      return "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30";
    case "rose":
      return "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30";
    case "purple":
      return "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/30";
    case "sky":
      return "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-500/30";
    case "slate":
      return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700";
    case "emerald":
    default:
      return "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30";
  }
};
