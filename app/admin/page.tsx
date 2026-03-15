"use client"
import { useEffect, useState } from "react"

export default function AdminPage() {
  const [userEmail, setUserEmail] = useState("")
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "" })
  const [loading, setLoading] = useState(true)

  // 🔗 Ensure this matches your latest Google Script Deployment URL
  const API_URL = "https://script.google.com/macros/s/AKfycbzoZ6rJnUJfPqQ86nlptocrWgIj5_843jkI-7i-aEJRRXpfCYwBGCRCCHqUgmNU5RMj/exec";

  const refreshAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?action=tasks&email=all`);
      const data = await res.json();
      setAllTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Admin fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    // Security check: If not you, kick them back to the dashboard
    if (email !== "jayvimp@gmail.com") {
      window.location.href = "/dashboard";
    } else {
      setUserEmail(email);
      refreshAdminData();
    }
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}?action=createUser`, {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      alert(`Profile created for ${newUser.name}!`);
      setNewUser({ email: "", password: "", name: "" });
    } catch (e) {
      alert("Error creating user");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this global log entry?")) return;
    try {
      await fetch(`${API_URL}?action=deleteTask`, {
        method: 'POST',
        body: JSON.stringify({ taskId })
      });
      refreshAdminData();
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center font-sans">
      <div className="animate-pulse text-gray-500 uppercase tracking-widest text-xs">Loading Global Data...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 font-sans text-sm">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">Admin Console 🛠️</h1>
          <p className="text-gray-500 text-[10px] uppercase">System Controller: {userEmail}</p>
        </div>
        <button 
          onClick={() => window.location.href = "/dashboard"} 
          className="bg-[#1e1e1e] border border-[#333] px-4 py-2 rounded-xl hover:bg-[#252525] transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* USER REGISTRATION PANEL */}
      <div className="max-w-5xl mx-auto mb-10 p-8 bg-blue-900/10 border border-blue-900/20 rounded-[2rem]">
        <h2 className="text-blue-400 font-bold mb-6 uppercase text-[10px] tracking-widest">Register New Team Member</h2>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input className="bg-[#121212] border border-[#333] p-3 rounded-xl outline-none focus:border-blue-500" placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
          <input className="bg-[#121212] border border-[#333] p-3 rounded-xl outline-none focus:border-blue-500" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
          <input className="bg-[#121212] border border-[#333] p-3 rounded-xl outline-none focus:border-blue-500" type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3 shadow-lg shadow-blue-900/20 transition-all">Add User</button>
        </form>
      </div>

      {/* GLOBAL FEED */}
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-4 px-2">
          <h2 className="font-bold text-lg">Global Task Feed</h2>
          <button onClick={refreshAdminData} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest">Refresh Logs</button>
        </div>
        <div className="bg-[#1e1e1e] rounded-[2rem] border border-[#333] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#252525] text-gray-500 text-[10px] uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">User</th>
                <th className="px-8 py-5">Task</th>
                <th className="px-8 py-5">Duration</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {allTasks.slice().reverse().map((t: any, i) => (
                <tr key={i} className="hover:bg-[#222] transition-colors">
                  <td className="px-8 py-5 text-gray-400 font-medium">{t.email}</td>
                  <td className="px-8 py-5 text-white">{t.task}</td>
                  <td className="px-8 py-5 font-bold text-green-400 font-mono">{t.total}h</td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleDeleteTask(t.id)} 
                      className="bg-red-900/20 text-red-500 border border-red-900/30 px-3 py-1 rounded-lg text-[10px] font-black hover:bg-red-900/40 transition-all"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
              {allTasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-600 italic">The global logs are currently empty.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}