"use client"
import { useEffect, useState, useRef } from "react"

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("")
  const [taskName, setTaskName] = useState("")
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  
  const [tasks, setTasks] = useState<any[]>([])
  const [weeklyStats, setWeeklyStats] = useState<any>({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 })
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // --- 🔗 NEW API URL CONFIG ---
  // This uses your .env.local link. The second link is a fallback just in case.
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://script.google.com/macros/s/AKfycbyHZQB3v2a8eXz9OpTVXe5Y6_JjM-pFUXylzsrjBacL4kwgMhM2zVMs3D0bIdzUuQY/exec";

  // --- 🎯 GOAL BAR LOGIC ---
  const totalWeeklyHours = Object.values(weeklyStats).reduce((acc: number, val: any) => acc + Number(val), 0);
  const weeklyGoal = 20;
  const progressPercentage = Math.min((totalWeeklyHours / weeklyGoal) * 100, 100);

  const refreshData = async (email: string) => {
    try {
      const [tRes, wRes] = await Promise.all([
        fetch(`${API_URL}?action=tasks&email=${email}`),
        fetch(`${API_URL}?action=getWeeklySummary&email=${email}`)
      ]);
      const taskData = await tRes.json();
      const weeklyData = await wRes.json();
      setTasks(Array.isArray(taskData) ? taskData : []);
      setWeeklyStats(weeklyData);
    } catch (e) {
      console.error("Sync error:", e);
    }
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) {
      window.location.href = "/";
    } else {
      setUserEmail(email);
      refreshData(email);
    }
  }, []);

  const toggleTimer = () => {
    if (isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsActive(false);
    } else {
      setIsActive(true);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
  };

  const handleFinish = async () => {
    if (seconds < 1) return;
    const hours = (seconds / 3600).toFixed(2);
    const today = new Date().toLocaleDateString('en-CA'); 

    try {
      await fetch(`${API_URL}?action=addTask`, {
        method: 'POST',
        body: JSON.stringify({
          email: userEmail,
          task: taskName || "Untitled Task",
          total: hours,
          date: today,
          start: new Date().toLocaleTimeString(),
          end: new Date().toLocaleTimeString()
        })
      });
      setSeconds(0);
      setTaskName("");
      refreshData(userEmail);
    } catch (e) {
      console.error("Error saving task:", e);
    }
  };

  const handleClearToday = async () => {
    if (!confirm("Delete all of today's logs?")) return;
    try {
      await fetch(`${API_URL}?action=clearToday`, {
        method: 'POST',
        body: JSON.stringify({ email: userEmail })
      });
      refreshData(userEmail);
    } catch (e) {
      console.error("Error clearing logs:", e);
    }
  };

  // --- 🆕 NEW RESET WEEK FUNCTION ---
  const handleResetWeek = async () => {
    if (!confirm("⚠️ This will delete ALL logs for this week. Are you sure?")) return;
    try {
      const res = await fetch(`${API_URL}?action=resetWeek`, {
        method: 'POST',
        body: JSON.stringify({ email: userEmail })
      });
      const result = await res.json();
      if (result.success) {
        refreshData(userEmail);
      }
    } catch (e) {
      console.error("Reset error:", e);
    }
  };

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
    const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold flex items-center gap-2"><span>🐷</span> Biik Tracker</h1>
        <div className="flex items-center gap-4">
          {userEmail === "jayvimp@gmail.com" && (
            <button onClick={() => window.location.href = "/admin"} className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-md hover:bg-blue-600/40 font-bold uppercase">
              Admin Console
            </button>
          )}
          <span className="text-sm text-gray-500 font-mono">{userEmail}</span>
          <button onClick={() => { localStorage.clear(); window.location.href = "/" }} className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded-md border border-red-900/50 hover:bg-red-900/40">LOGOUT</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-[#1e1e1e] p-8 rounded-3xl border border-[#333] flex flex-col items-center">
          <input type="text" placeholder="What are you working on?" value={taskName} onChange={e => setTaskName(e.target.value)} className="bg-transparent text-center text-lg mb-4 outline-none border-b border-[#333] w-full pb-2 focus:border-white transition-colors" />
          <div className="text-6xl font-mono font-black mb-8 tracking-tighter">{formatTime(seconds)}</div>
          <div className="flex gap-3 w-full">
            <button onClick={toggleTimer} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${isActive ? "bg-yellow-600" : "bg-white text-black hover:bg-gray-100"}`}>
              {isActive ? "PAUSE" : "START"}
            </button>
            {!isActive && seconds > 0 && (
              <button onClick={handleFinish} className="flex-1 py-4 rounded-2xl font-bold bg-green-600 hover:bg-green-700">FINISH</button>
            )}
          </div>
        </div>

        <div className="bg-[#1e1e1e] p-8 rounded-3xl border border-[#333]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Weekly Performance (Hrs)</h2>
            <div className="flex gap-4">
              <button onClick={handleResetWeek} className="text-[9px] text-red-500/40 hover:text-red-500 uppercase font-bold transition-colors">Reset Week</button>
              <span className="text-[10px] font-mono text-green-400 font-bold">{totalWeeklyHours.toFixed(1)} / {weeklyGoal}h</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-8">
            {Object.entries(weeklyStats).map(([day, val]: [string, any]) => (
              <div key={day} className="flex flex-col items-center p-3 bg-[#121212] rounded-xl border border-[#333]">
                <span className="text-[10px] text-gray-600 mb-1">{day}</span>
                <span className={`text-sm font-bold ${val > 0 ? "text-green-400" : "text-gray-800"}`}>{Number(val).toFixed(1)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Work Goal Progress</p>
              <p className="text-[10px] text-pink-400 font-bold italic">
                {totalWeeklyHours >= weeklyGoal ? "Goal Hit! i wabyu ✨" : "Keep going, biik!"}
              </p>
            </div>
            <div className="w-full h-3 bg-[#121212] rounded-full border border-[#333] overflow-hidden p-[2px]">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-green-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(74,222,128,0.3)]"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-4 px-2">
          <h2 className="text-lg font-bold">Daily Log</h2>
          <button onClick={handleClearToday} className="text-[10px] text-gray-500 hover:text-red-400 uppercase tracking-widest transition-colors">Clear Today's Logs</button>
        </div>
        <div className="bg-[#1e1e1e] rounded-[2rem] border border-[#333] overflow-hidden text-sm">
          <table className="w-full text-left">
            <tbody className="divide-y divide-[#333]">
              {tasks.length > 0 ? tasks.slice().reverse().map((t: any, i) => (
                <tr key={i} className="hover:bg-[#252525] transition-colors">
                  <td className="px-8 py-5">{t.task}</td>
                  <td className="px-8 py-5 text-green-400 font-bold">{t.total}h</td>
                  <td className="px-8 py-5 text-gray-600 text-right font-mono">{String(t.date).split('T')[0]}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-gray-700 italic">No tasks logged. Start the timer to begin! 🐷</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}