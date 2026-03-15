"use client"
import { useEffect, useState } from "react"

export default function AdminConsole() {
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [stats, setStats] = useState<any>({ totalHours: 0, activeUsers: 0 })
  const [loading, setLoading] = useState(true)

  // 🔗 UPDATED: Using your latest Google Script URL
  const API_URL = "https://script.google.com/macros/s/AKfycbzoZ6rJnUJfPqQ86nlptocrWgIj5_843jkI-7i-aEJRRXpfCYwBGCRCCHqUgmNU5RMj/exec";

  const loadAdminData = async () => {
    try {
      // Fetches everyone's data using the new "email=all" logic
      const res = await fetch(`${API_URL}?action=tasks&email=all`); 
      const data = await res.json();
      
      const total = data.reduce((sum: number, t: any) => sum + parseFloat(t.total || 0), 0);
      const uniqueUsers = new Set(data.map((t: any) => t.email)).size;

      setAllTasks(data);
      setStats({ totalHours: total.toFixed(2), activeUsers: uniqueUsers });
      setLoading(false);
    } catch (e) {
      console.error("Admin fetch error:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center font-sans">
      <div className="animate-spin text-4xl mb-4">🐷</div>
      <p className="text-gray-500 animate-pulse">Fetching global logs...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Biik Admin Console 🛠️</h1>
            <p className="text-xs text-gray-500">Global System Overview</p>
          </div>
          <button 
            onClick={() => window.location.href = "/dashboard"} 
            className="text-xs bg-[#252525] px-4 py-2 rounded-lg border border-[#333] hover:bg-[#333] transition-colors"
          >
            Back to Dashboard
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#1e1e1e] p-8 rounded-3xl border border-[#333]">
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold">Total System Hours</p>
            <p className="text-5xl font-mono font-black text-green-400">{stats.totalHours}<span className="text-lg ml-1">h</span></p>
          </div>
          <div className="bg-[#1e1e1e] p-8 rounded-3xl border border-[#333]">
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mb-2 font-bold">Active Testers</p>
            <p className="text-5xl font-mono font-black text-blue-400">{stats.activeUsers}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Global Task Feed</h2>
            <button onClick={loadAdminData} className="text-[10px] text-gray-500 hover:text-white uppercase">Refresh Feed</button>
        </div>

        <div className="bg-[#1e1e1e] rounded-3xl border border-[#333] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#252525] text-gray-500 uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">User Email</th>
                  <th className="px-6 py-4">Task Name</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Date Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {allTasks.length > 0 ? allTasks.slice().reverse().map((t: any, i: number) => (
                  <tr key={i} className="hover:bg-[#252525]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-400">{t.email}</td>
                    <td className="px-6 py-4 text-white">{t.task}</td>
                    <td className="px-6 py-4 text-green-400 font-mono font-bold">+{t.total}h</td>
                    <td className="px-6 py-4 text-gray-600 text-right font-mono">{t.date}</td>
                  </tr>
                )) : (
                    <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-gray-600">No data found in the system.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}