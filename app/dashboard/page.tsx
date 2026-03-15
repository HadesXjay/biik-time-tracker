"use client"
import { useEffect, useState, useRef } from "react"

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("")
  const [taskName, setTaskName] = useState("")
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  
  // FIXED: Explicit types to prevent Vercel build errors
  const [tasks, setTasks] = useState<any[]>([])
  const [weeklyStats, setWeeklyStats] = useState<any>({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 })
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 🔗 Using your updated Script URL
  const API_URL = "https://script.google.com/macros/s/AKfycbwCZVV6Y8EZxxlhRpJRWV_V-9wfYwJeZ0nAW35h8a5joMSDFGIXgUDbSpCHMDZwfT2x/exec";

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
    const today = new Date().toISOString().split('T')[0];

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
          <span className="text-sm text-gray-500">{userEmail}</span>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = "/" }} 
            className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded-md border border-red-900/50 hover:bg-red-900/40"
          >
            LOGOUT
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-[#1e1e1e] p-8 rounded-3xl border border-[#333] flex flex-col items-center">
          <input 
            type="text" 
            placeholder="Task name..." 
            value={taskName} 
            onChange={e => setTaskName(e.target.value)} 
            className="bg-transparent text-center text-lg mb-4 outline-none border-b border-[#333] w-full pb-2" 
          />
          <div className="text-6xl font-mono font-black mb-8">{formatTime(seconds)}</div>
          <div className="flex gap-3 w-full">
            <button 
              onClick={toggleTimer} 
              className={`flex-1 py-4 rounded-xl font-bold transition-all ${isActive ? "bg-yellow-600" : "bg-white text-black"}`}
            >
              {isActive ? "PAUSE" : "START"}
            </button>
            {!isActive && seconds > 0 && (
              <button onClick={handleFinish} className="flex-1 py-4 rounded-xl font-bold bg-green-600 hover:bg-green-700">
                FINISH
              </button>
            )}
          </div>
        </div>

        <div className="bg-[#1e1e1e] p-8 rounded-3xl border border-[#333]">
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-6">Weekly Stats (Hrs)</h2>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(weeklyStats).map(([day, val]: [string, any]) => (
              <div key={day} className="flex flex-col items-center p-2 bg-[#252525] rounded-lg border border-[#333]">
                <span className="text-[10px] text-gray-500 mb-1">{day}</span>
                <span className={`text-sm font-bold ${val > 0 ? "text-green-400" : "text-gray-800"}`}>
                  {Number(val).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-bold mb-4">Daily Log</h2>
        <div className="bg-[#1e1e1e] rounded-2xl border border-[#333] overflow-hidden text-sm">
          <table className="w-full text-left">
            <tbody className="divide-y divide-[#333]">
              {tasks.length > 0 ? tasks.slice().reverse().map((t: any, i) => (
                <tr key={i} className="hover:bg-[#252525] transition-colors">
                  <td className="px-6 py-4">{t.task}</td>
                  <td className="px-6 py-4 text-green-400 font-bold">{t.total}h</td>
                  <td className="px-6 py-4 text-gray-500 text-right">{t.date.split('T')[0]}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-600">No tasks logged. 🐷</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}