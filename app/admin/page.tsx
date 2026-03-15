"use client"
import { useEffect, useState } from "react"

interface GlobalTask {
  email: string;
  task: string;
  total: string | number;
  taskId: string;
  date: string;
}

export default function AdminConsole() {
  const [tasks, setTasks] = useState<GlobalTask[]>([])
  const [loading, setLoading] = useState(true)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const refreshLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=tasks&email=all`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Admin fetch error:", e); } finally { setLoading(false); }
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email?.toLowerCase().trim() !== "jayvimp@gmail.com") {
      window.location.href = "/dashboard";
    } else { refreshLogs(); }
  }, []);

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this log?")) return;
    try {
      const res = await fetch(`${API_URL}?action=deleteTask`, {
        method: 'POST',
        body: JSON.stringify({ taskId: String(taskId) }) 
      });
      const result = await res.json();
      if (result.success) refreshLogs();
    } catch (e) { console.error("Delete error:", e); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Admin Console 🛠️</h1>
          <p className="text-[10px] text-blue-500 font-mono uppercase tracking-widest">Master Control: jayvimp@gmail.com</p>
        </div>
        <button onClick={() => window.location.href = "/dashboard"} className="text-xs bg-[#1e1e1e] px-4 py-2 rounded-lg border border-[#333] font-bold">Back to Dashboard</button>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg">System Feed</h2>
          <button onClick={refreshLogs} className="text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-widest">{loading ? "Syncing..." : "↻ Refresh Database"}</button>
        </div>

        <div className="bg-[#141414] rounded-3xl border border-[#222] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-gray-600 uppercase tracking-widest border-b border-[#222]">
                <th className="px-8 py-4 font-bold">User</th>
                <th className="px-8 py-4 font-bold">Task</th>
                <th className="px-8 py-4 font-bold">Duration</th>
                <th className="px-8 py-4 font-bold text-right">Control</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#1e1e1e]">
              {tasks.length > 0 ? tasks.slice().reverse().map((t, i) => (
                <tr key={t.taskId || i} className="hover:bg-[#1a1a1a]">
                  <td className="px-8 py-5 text-gray-400 font-mono text-xs">{t.email}</td>
                  <td className="px-8 py-5 text-gray-200">{t.task}</td>
                  <td className="px-8 py-5"><span className="text-green-500 font-bold">{t.total}h</span></td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => handleDelete(t.taskId)} className="text-[9px] font-black uppercase bg-red-900/20 text-red-500 border border-red-900/30 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition-all">Delete Log</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-700 italic">No global logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}