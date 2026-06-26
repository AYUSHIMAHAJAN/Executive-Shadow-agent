import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Task, StructuredDeadline } from "../types";
import { TrendingUp, CheckCircle, Activity, Target, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface AnalyticsProps {
  tasks: Task[];
  structuredDeadlines?: StructuredDeadline[];
  isDark: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ tasks, structuredDeadlines = [], isDark }) => {
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const pendingTasks = tasks.filter(t => !t.isCompleted).length;
  
  const completedDeadlines = structuredDeadlines.filter(dl => dl.isCompleted).length;
  const pendingDeadlines = structuredDeadlines.filter(dl => !dl.isCompleted).length;

  const now = Date.now();
  const overdueDeadlines = structuredDeadlines.filter(dl => !dl.isCompleted && new Date(dl.dueDateTime).getTime() < now).length;

  const totalCompleted = completedTasks + completedDeadlines;
  const totalPending = pendingTasks + pendingDeadlines;

  const pieData = [
    { name: "Completed", value: totalCompleted },
    { name: "Pending", value: totalPending }
  ];

  const COLORS = ["#10b981", isDark ? "#475569" : "#cbd5e1"];

  const highPriority = tasks.filter(t => t.priority === "High").length + structuredDeadlines.filter(dl => dl.priority === "High").length;
  const medPriority = tasks.filter(t => t.priority === "Medium").length + structuredDeadlines.filter(dl => dl.priority === "Medium").length;
  const lowPriority = tasks.filter(t => t.priority === "Low").length + structuredDeadlines.filter(dl => dl.priority === "Low").length;

  const barData = [
    { name: "High", count: highPriority },
    { name: "Medium", count: medPriority },
    { name: "Low", count: lowPriority }
  ];

  const cardVariants = {
    hover: { scale: 1.05, y: -4, transition: { duration: 0.2, type: "spring", stiffness: 300 } },
    tap: { scale: 0.95 }
  };

  return (
    <div className={`p-6 md:p-8 flex-1 flex flex-col rounded-2xl shadow-sm ${isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800"
      >
        <TrendingUp className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-bold tracking-tight">Workload Analytics</h2>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {[
          { icon: Target, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/40", label: "Tasks", value: tasks.length },
          { icon: Target, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/40", label: "Deadlines", value: structuredDeadlines.length },
          { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/40", label: "Completed", value: totalCompleted },
          { icon: Activity, color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/40", label: "Pending", value: totalPending },
          { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/40", label: "Overdue", value: overdueDeadlines }
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            custom={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            variants={cardVariants} 
            whileHover="hover" 
            whileTap="tap" 
            className={`p-6 rounded-2xl ${isDark ? "bg-slate-950/60 shadow-lg shadow-black/20" : "bg-slate-50 shadow-sm shadow-slate-200/50"} flex items-center gap-5 cursor-pointer hover:shadow-md transition-shadow`}
          >
            <div className={`w-14 h-14 rounded-full ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <div className="text-sm text-slate-500 font-mono mb-1">{stat.label}</div>
              <div className="text-3xl font-bold">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-[400px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} 
          className={`p-6 rounded-2xl border flex flex-col ${isDark ? "border-slate-800 bg-slate-950/20" : "border-slate-200 bg-white"} cursor-crosshair`}
        >
          <h3 className="text-sm font-mono font-bold text-slate-500 mb-8 text-center uppercase tracking-widest">Completion Rate</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity duration-300 outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderRadius: '12px',
                    border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px'
                  }} 
                  itemStyle={{ fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} 
          className={`p-6 rounded-2xl border flex flex-col ${isDark ? "border-slate-800 bg-slate-950/20" : "border-slate-200 bg-white"} cursor-crosshair`}
        >
          <h3 className="text-sm font-mono font-bold text-slate-500 mb-8 text-center uppercase tracking-widest">Priority Distribution</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.5} />
                <XAxis dataKey="name" tick={{fontSize: 13, fontWeight: 500}} tickLine={false} axisLine={false} tickMargin={12} />
                <Tooltip 
                  cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderRadius: '12px',
                    border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1500}>
                  {
                    barData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#f43f5e' : index === 1 ? '#eab308' : '#3b82f6'} 
                        className="hover:opacity-80 transition-opacity duration-300"
                      />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
