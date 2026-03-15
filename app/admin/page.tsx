"use client"
import { useEffect, useState } from "react"

interface GlobalTask {
  email: string;
  task: string;
  total: string | number;
  taskId: string;
}

export default function AdminConsole() {
  const [tasks, setTasks] = useState<GlobalTask[]>([])
  const [loading, setLoading] = useState(true)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const refreshLogs = async () => {
    if (!API_URL) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=tasks&email=all`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email !== "jayvimp@gmail.com") {
      window.location.href = "/dashboard";
    } else {
      refreshLogs();
    }
  }, []);

  const handleDelete = async (taskId: string) => {
    if (!confirm("Permanently delete this specific log?")) return;
    try {
      const res = await fetch(`${API_URL}?action=deleteTask`, {
        method: 'POST',
        body: JSON.stringify({ taskId: String(taskId) })
      });
      const result = await res.json();
      if (result.success) {
        refreshLogs();
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">Admin Console 🛠️</h1>
          <p className="text-[10px] text-gray-500 font-mono uppercase">System Controller: jayvimp@gmail.com</p>
        </div>
        <button onClick={() => window.location.href = "/dashboard"} className="text-xs bg-[#1e1e1e] px-4 py-2 rounded-lg border border-[#333] hover:bg-[#252525]">
          Back to Dashboard
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="bg-[#141414] rounded-3xl border border-[#222] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-gray-600 uppercase tracking-widest border-b border-[#222]">
                <th className="px-8 py-4">User</th>
                <th className="px-8 py-4">Task</th>
                <th className="px-8 py-4">Duration</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#1e1e1e]">
              {tasks.length > 0 ? tasks.slice().reverse().map((t) => (
                <tr key={t.taskId} className="hover:bg-[#1a1a1a]">
                  <td className="px-8 py-5 text-gray-400 font-mono text-xs">{t.email}</td>
                  <td className="px-8 py-5">{t.task}</td>
                  <td className="px-8 py-5 text-green-500 font-bold">{t.total}h</td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => handleDelete(t.taskId)} className="text-[9px] font-black uppercase bg-red-900/20 text-red-500 border border-red-900/30 px-3 py-1 rounded">
                      Delete
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-700 italic">No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}