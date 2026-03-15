"use client"
import { useEffect, useState } from "react"

export default function AdminConsole() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Uses the environment variable we set up in .env.local
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://script.google.com/macros/s/AKfycbyHZQB3v2a8eXz9OpTVXe5Y6_JjM-pFUXylzsrjBacL4kwgMhM2zVMs3D0bIdzUuQY/exec";

  const refreshLogs = async () => {
    setLoading(true);
    try {
      // action=tasks&email=all triggers the admin view in your script
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
    // Simple security: only allow your specific email to view this page
    if (email !== "jayvimp@gmail.com") {
      window.location.href = "/dashboard";
    } else {
      refreshLogs();
    }
  }, []);

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this specific log?")) return;

    try {
      const res = await fetch(`${API_URL}?action=deleteTask`, {
        method: 'POST',
        body: JSON.stringify({ taskId: String(taskId) }) // Ensuring ID is a string for the script
      });
      const result = await res.json();
      if (result.success) {
        refreshLogs(); // Refresh the list after successful deletion
      } else {
        alert("Delete failed. Check Google Sheet permissions.");
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
            Admin Console 🛠️
          </h1>
          <p className="text-[10px] text-gray-500 font-mono uppercase">System Controller: {localStorage.getItem("email")}</p>
        </div>
        <button onClick={() => window.location.href = "/dashboard"} className="text-xs bg-[#1e1e1e] px-4 py-2 rounded-lg border border-[#333] hover:bg-[#252525]">
          Back to Dashboard
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg">Global Task Feed</h2>
          <button onClick={refreshLogs} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest">
            {loading ? "Refreshing..." : "Refresh Logs"}
          </button>
        </div>

        <div className="bg-[#141414] rounded-3xl border border-[#222] overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] text-gray-600 uppercase tracking-widest border-b border-[#222]">
                <th className="px-8 py-4 font-bold">User</th>
                <th className="px-8 py-4 font-bold">Task</th>
                <th className="px-8 py-4 font-bold">Duration</th>
                <th className="px-8 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#1e1e1e]">
              {tasks.length > 0 ? tasks.slice().reverse().map((t: any) => (
                <tr key={t.taskId} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-8 py-5 text-gray-400 font-mono text-xs">{t.email}</td>
                  <td className="px-8 py-5 text-gray-200">{t.task}</td>
                  <td className="px-8 py-5">
                    <span className="text-green-500 font-bold">{t.total}h</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleDelete(t.taskId)}
                      className="text-[9px] font-black uppercase bg-red-900/20 text-red-500 border border-red-900/30 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition-all"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-700 italic">
                    {loading ? "Loading database..." : "No tasks found in the system."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}