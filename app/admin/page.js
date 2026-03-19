"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../Lib/supabaseClient" 

export default function AdminConsole() {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [attempts, setAttempts] = useState([])
  const [newUserEmail, setNewUserEmail] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ task_name: "", duration_hours: 0, username: "" })
  const [isAuthorized, setIsAuthorized] = useState(null)
  const [loading, setLoading] = useState(true)

  // FIXED: Changed 'email' to 'user_email' to match Supabase schema
  const [migrationData, setMigrationData] = useState({
    user_email: "daphne@example.com", 
    username: "daphne_HVRCloud",
    task_name: "",
    duration_hours: "",
    target_date: new Date().toLocaleDateString('en-CA')
  })

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

  // NEW: Quick Helper to update Daphne's email based on the selected username
  useEffect(() => {
    const emailMap = {
      "daphne_HVRCloud": "daphne@hvr.cloud", // Update with her actual work emails
      "daphne_Lunarglow": "daphne@lunarglow.com"
    }
    setMigrationData(prev => ({ ...prev, user_email: emailMap[prev.username] || "daphne@example.com" }))
  }, [migrationData.username])

  const handleManualAdd = async (e) => {
    e.preventDefault()
    // We send the migrationData object which now uses the correct 'user_email' key
    const { error } = await supabase.from('activity_logs').insert([migrationData])
    if (!error) {
      alert("Entry Migrated Successfully!");
      setMigrationData({ ...migrationData, task_name: "", duration_hours: "" });
      refreshAll();
    } else {
      // If you still get a 'column not found' error, check if the DB column is actually 'user_id' or 'email_address'
      alert(`Database Error: ${error.message}`);
    }
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

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center text-white">
          <h1 className="text-2xl font-black italic mb-2">ACCESS <span className="text-red-600">DENIED</span></h1>
          <button onClick={() => window.location.href = "/dashboard"} className="mt-8 text-[9px] bg-white text-black px-6 py-2 rounded-full font-black uppercase tracking-tighter hover:bg-gray-200">Go Back</button>
      </div>
    )
  }

  if (isAuthorized === null) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">HADES <span className="text-white">ADMIN</span></h1>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Control Center v2.5</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.location.href = "/dashboard"} className="text-[10px] bg-[#1a1a1a] border border-[#333] px-6 py-2 rounded-xl font-bold uppercase hover:bg-white hover:text-black transition-all">Dashboard</button>
          <button onClick={handleLogout} className="p-2.5 bg-[#1a1a1a] border border-[#333] rounded-xl hover:bg-red-900/20 group transition-all">Logout</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6">
          <div className="bg-[#141414] p-6 rounded-3xl border border-blue-900/30">
            <h2 className="text-[10px] font-black uppercase text-blue-500 mb-4 tracking-widest">Sheet Migration</h2>
            <form onSubmit={handleManualAdd} className="space-y-3">
                <input type="date" value={migrationData.target_date} onChange={e => setMigrationData({...migrationData, target_date: e.target.value})} className="bg-[#0a0a0a] border border-[#333] rounded-xl p-2 text-[10px] w-full"/>
                <select value={migrationData.username} onChange={e => setMigrationData({...migrationData, username: e.target.value})} className="bg-[#0a0a0a] border border-[#333] rounded-xl p-2 text-[10px] w-full">
                    <option value="daphne_HVRCloud">HVRCloud</option>
                    <option value="daphne_Lunarglow">Lunarglow</option>
                </select>
                <input placeholder="Task Name" value={migrationData.task_name} onChange={e => setMigrationData({...migrationData, task_name: e.target.value})} className="bg-[#0a0a0a] border border-[#333] rounded-xl p-2 text-[10px] w-full"/>
                <input type="number" step="0.01" placeholder="Hours" value={migrationData.duration_hours} onChange={e => setMigrationData({...migrationData, duration_hours: e.target.value})} className="bg-[#0a0a0a] border border-[#333] rounded-xl p-2 text-[10px] w-full"/>
                <button type="submit" className="w-full bg-blue-600 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors">Migrate Entry</button>
            </form>
          </div>

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
        </div>

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
                    <p className="text-[9px] text-gray-600 mt-1">{t.user_email}</p>
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