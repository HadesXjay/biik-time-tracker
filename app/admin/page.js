"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

export default function AdminConsole() {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [attempts, setAttempts] = useState([])
  const [newUserEmail, setNewUserEmail] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ task_name: "", duration_hours: 0, username: "" })
  const [isAuthorized, setIsAuthorized] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshAll = async () => {
    setLoading(true)
    const { data: logs } = await supabase.from('activity_logs').select('*').order('target_date', { ascending: false })
    const { data: authUsers } = await supabase.from('authorized_users').select('*')
    const { data: loginLogs } = await supabase.from('login_attempts').select('*').order('created_at', { ascending: false }).limit(5)
    
    setTasks(logs || [])
    setUsers(authUsers || [])
    setAttempts(loginLogs || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    window.location.href = "/"
  }

  useEffect(() => {
    const email = localStorage.getItem("email")
    
    const verifyAccess = async () => {
      if (email === "jayvimp@gmail.com") {
        setIsAuthorized(true)
        await supabase.from('login_attempts').insert([{ attempted_email: email, status: 'SUCCESS' }])
        refreshAll()
      } else {
        setIsAuthorized(false)
        await supabase.from('login_attempts').insert([{ attempted_email: email || 'Unknown', status: 'DENIED' }])
      }
    }
    verifyAccess()
  }, [])

  // --- LOG MANAGEMENT ---
  const startEdit = (t) => {
    setEditingId(t.id)
    setEditForm({ task_name: t.task_name, duration_hours: t.duration_hours, username: t.username })
  }

  const saveEdit = async (id) => {
    const { error } = await supabase.from('activity_logs')
      .update({
        task_name: editForm.task_name,
        duration_hours: parseFloat(editForm.duration_hours),
        username: editForm.username
      }).eq('id', id)
    
    if (!error) { setEditingId(null); refreshAll(); }
  }

  const handleDeleteLog = async (id) => {
    if (confirm("Delete this work log permanently?")) {
      await supabase.from('activity_logs').delete().eq('id', id)
      refreshAll()
    }
  }

  // --- USER MANAGEMENT ---
  const addUser = async () => {
    if (!newUserEmail) return
    const emailToAdd = newUserEmail.toLowerCase().trim()
    const { error } = await supabase.from('authorized_users').insert([{ email: emailToAdd }])
    if (!error) { setNewUserEmail(""); refreshAll(); }
  }

  const removeUser = async (id) => {
    if (confirm("Revoke access for this user?")) {
      await supabase.from('authorized_users').delete().eq('id', id)
      refreshAll()
    }
  }

  // --- SECURITY FIREWALL UI ---
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-sans text-center">
        <div className="bg-[#141414] p-12 rounded-[40px] border border-red-900/30 shadow-2xl">
          <span className="text-6xl mb-6 block">🚫</span>
          <h1 className="text-2xl font-black italic text-white mb-2">ACCESS <span className="text-red-600">DENIED</span></h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">You're not authorized here :P</p>
          <button onClick={() => window.location.href = "/dashboard"} className="mt-8 text-[9px] bg-white text-black px-6 py-2 rounded-full font-black uppercase tracking-tighter hover:bg-gray-200 transition-all">Go Back</button>
        </div>
      </div>
    )
  }

  if (isAuthorized === null) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      {/* HEADER WITH LOGOUT */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">HADES <span className="text-white">ADMIN</span></h1>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Control Center v2.5</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => window.location.href = "/dashboard"} className="text-[10px] bg-[#1a1a1a] border border-[#333] px-6 py-2 rounded-xl font-bold uppercase hover:bg-white hover:text-black transition-all">Dashboard</button>
          <button onClick={handleLogout} className="p-2.5 bg-[#1a1a1a] border border-[#333] rounded-xl hover:bg-red-900/20 hover:border-red-900/50 group transition-all" title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-red-500 transition-colors">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6">
          {/* AUTHORIZED ACCESS */}
          <div className="bg-[#141414] p-6 rounded-3xl border border-[#222]">
            <h2 className="text-[10px] font-black uppercase text-blue-500 mb-4 tracking-widest">Authorized Access</h2>
            <div className="flex gap-2 mb-6">
              <input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email..." className="bg-[#0a0a0a] border border-[#333] rounded-xl px-3 py-2 text-xs w-full outline-none focus:border-blue-500"/>
              <button onClick={addUser} className="bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold">+</button>
            </div>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex justify-between items-center bg-[#0a0a0a] p-3 rounded-xl border border-[#222]">
                  <span className="text-[10px] text-gray-400 font-mono truncate mr-2">{u.email}</span>
                  {u.email !== "jayvimp@gmail.com" && <button onClick={() => removeUser(u.id)} className="text-red-900 text-[10px] font-black uppercase hover:text-red-500">Del</button>}
                </div>
              ))}
            </div>
          </div>

          {/* ACCESS LOGS */}
          <div className="bg-[#141414] p-6 rounded-3xl border border-[#222]">
            <h2 className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-widest">Recent Access Logs</h2>
            <div className="space-y-3">
              {attempts.map(a => (
                <div key={a.id} className="text-[9px] border-b border-[#222] pb-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 truncate w-24">{a.attempted_email}</span>
                    <span className={a.status === 'SUCCESS' ? "text-green-500" : "text-red-500"}>{a.status}</span>
                  </div>
                  <div className="text-gray-600 mt-1">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WORK LOGS TABLE */}
        <div className="lg:col-span-3 bg-[#141414] rounded-3xl border border-[#222] overflow-hidden">
          <div className="p-6 border-b border-[#222] bg-[#1a1a1a]/50 flex justify-between">
            <h2 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Global Activity Logs</h2>
            {loading && <div className="text-blue-500 animate-pulse text-[10px] font-black">REFRESHING...</div>}
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a1a1a] text-gray-600 font-black uppercase text-[9px]">
              <tr><th className="px-6 py-4">Client / User</th><th className="px-6 py-4">Task & Hours</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-4">
                    {editingId === t.id ? <input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className="bg-black border border-blue-500/50 p-1 rounded text-blue-400 w-full text-xs"/> : <span className="text-blue-500 font-bold font-mono">{t.username || "General"}</span>}
                    <p className="text-[9px] text-gray-600 mt-1">{t.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === t.id ? <div className="flex gap-2"><input value={editForm.task_name} onChange={e => setEditForm({...editForm, task_name: e.target.value})} className="bg-black border border-[#333] p-1 rounded w-full"/><input type="number" value={editForm.duration_hours} onChange={e => setEditForm({...editForm, duration_hours: e.target.value})} className="bg-black border border-[#333] p-1 rounded w-16"/></div> : <><p className="text-gray-200 font-medium">{t.task_name}</p><p className="text-green-500 font-bold mt-1">{t.duration_hours}h <span className="text-gray-700 font-normal ml-2">| {t.target_date}</span></p></>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === t.id ? <button onClick={() => saveEdit(t.id)} className="text-green-500 font-bold uppercase mr-3">Save</button> : <button onClick={() => startEdit(t)} className="text-blue-500 font-bold uppercase mr-3 hover:underline">Edit</button>}
                    <button onClick={() => handleDeleteLog(t.id)} className="text-red-900 font-bold uppercase hover:text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}