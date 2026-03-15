"use client"
import { useEffect, useState, useRef } from "react"

// Interface to prevent "Implicit Any" errors
interface Task {
  task: string;
  total: string | number;
  date: string;
  taskId?: string;
}

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("")
  const [taskName, setTaskName] = useState("")
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [weeklyStats, setWeeklyStats] = useState<Record<string, number>>({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 })
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const totalWeeklyHours = Object.values(weeklyStats).reduce((acc, val) => acc + Number(val), 0);
  const weeklyGoal = 20;
  const progressPercentage = Math.min((totalWeeklyHours / weeklyGoal) * 100, 100);

  const refreshData = async (email: string) => {
    if (!API_URL) return;
    try {
      const [tRes, wRes] = await Promise.all([
        fetch(`${API_URL}?action=tasks&email=${email}`),
        fetch(`${API_URL}?action=getWeeklySummary&email=${email}`)
      ]);
      const taskData = await tRes.json();
      const weeklyData = await wRes.json();
      setTasks(Array.isArray(taskData) ? taskData : []);
      setWeeklyStats(weeklyData || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 });
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
    if (seconds < 1 || !API_URL) return;
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
        })
      });
      setSeconds(0);
      setTaskName("");
      refreshData(userEmail);
    } catch (e) {
      console.error("Error saving task:", e);
    }
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
          <button onClick={() => { localStorage.clear(); window.location.href = "/" }} className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded-md border border-red-900/50">LOGOUT</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-[#1e1e1e] p-8 rounded-3xl border border-[#333] flex flex-col items-center">
          <input type="text" placeholder="What are you working on?" value={taskName} onChange={e => setTaskName(e.target.value)} className="bg-transparent text-center text-lg mb-4 outline-none border-b border-[#333] w-full pb-2" />
          <div className="text-6xl font-mono font-black mb-8 tracking-tighter">
            {Math.floor(seconds / 3600).toString().padStart(2, '0')}:
            {Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}:
            {(seconds % 60).toString().padStart(2, '0')}
          </div>
          <button onClick={toggleTimer} className={`w-full py-4 rounded-2xl font-bold ${isActive ? "bg-yellow-600" : "bg-white text-black"}`}>
            {isActive ? "PAUSE" : "START"}
          </button>
          {!isActive && seconds > 0 && (
            <button onClick={handleFinish} className="w-full mt-3 py-4 rounded-2xl font-bold bg-green-600">FINISH</button>
          )}
        </div>

        <div className="bg-[#1e1e1e] p-8 rounded-3xl border border-[#333]">
           <p className="text-[10px] text-pink-400 font-bold italic mb-2">
            {totalWeeklyHours >= weeklyGoal ? "Goal Hit! i wabyu ✨" : "Keep going, biik?"}
          </p>
          <div className="w-full h-3 bg-[#121212] rounded-full overflow-hidden border border-[#333]">
            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progressPercentage}%` }} />
          </div>
          <div className="grid grid-cols-5 gap-2 mt-6">
            {Object.entries(weeklyStats).map(([day, val]) => (
              <div key={day} className="text-center p-2 bg-[#121212] rounded-lg border border-[#333]">
                <p className="text-[9px] text-gray-500 uppercase">{day}</p>
                <p className="text-xs font-bold">{Number(val).toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1e1e1e] rounded-3xl border border-[#333] overflow-hidden">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-[#333]">
              {tasks.length > 0 ? tasks.slice().reverse().map((t, i) => (
                <tr key={t.taskId || i} className="hover:bg-[#252525]">
                  <td className="px-8 py-5">{t.task}</td>
                  <td className="px-8 py-5 text-green-400 font-bold">{t.total}h</td>
                  <td className="px-8 py-5 text-gray-500 text-right">{String(t.date).split('T')[0]}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="py-10 text-center text-gray-600">No logs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}