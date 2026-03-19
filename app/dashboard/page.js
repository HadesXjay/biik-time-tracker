"use client"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("")
  const [taskName, setTaskName] = useState("")
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA')) 
  const [tasks, setTasks] = useState([])
  const [activeClient, setActiveClient] = useState("daphne_HVRCloud") 
  const [weeklyStats, setWeeklyStats] = useState({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 })
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null) // New state for visual feedback

  const clients = ["daphne_HVRCloud", "daphne_Lunarglow"]

  useEffect(() => {
    const email = localStorage.getItem("email")
    if (!email) { 
      window.location.href = "/" 
    } else { 
      setUserEmail(email)
      refreshData(email, activeClient) 
    }
  }, [activeClient])

  useEffect(() => {
    let interval = null
    if (isActive) {
      interval = setInterval(() => {
        const start = parseInt(localStorage.getItem("biik_timer_start"))
        setSeconds(Math.floor((Date.now() - start) / 1000))
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isActive])

  const refreshData = async (email, client) => {
    setLoading(true)
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff)).toISOString().split('T')[0]

    try {
      const { data } = await supabase.from('activity_logs')
        .select('*')
        .eq('email', email)
        .eq('username', client)
        .order('target_date', { ascending: false })
      setTasks(data || [])

      const { data: weekData } = await supabase.from('activity_logs')
        .select('target_date, duration_hours')
        .eq('email', email)
        .eq('username', client)
        .gte('target_date', monday)
      
      const stats = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
      weekData?.forEach(log => {
        const dayName = new Date(log.target_date).toLocaleDateString('en-US', { weekday: 'short' })
        if (stats[dayName] !== undefined) stats[dayName] += Number(log.duration_hours)
      })
      setWeeklyStats(stats)
    } finally { setLoading(false) }
  }

  const toggleTimer = () => {
    if (isActive) { 
      setIsActive(false) 
    } else { 
      const startTime = Date.now() - (seconds * 1000)
      localStorage.setItem("biik_timer_start", startTime.toString())
      setIsActive(true) 
    }
  }

  const handleFinish = async () => {
    if (seconds < 1) return
    setLoading(true)
    const hours = parseFloat((seconds / 3600).toFixed(2))
    
    const { error } = await supabase.from('activity_logs').insert([{ 
      email: userEmail, 
      username: activeClient, 
      task_name: taskName || "Untitled Task", 
      duration_hours: hours, 
      target_date: selectedDate 
    }])

    if (!error) {
      localStorage.removeItem("biik_timer_start")
      setSeconds(0); setTaskName(""); setIsActive(false)
      refreshData(userEmail, activeClient)
    }
    setLoading(false)
  }

  // Improved Copy Function with Feedback
  const copyToClipboard = (task) => {
    const text = `${task.task_name} | ${task.duration_hours}h | ${task.target_date}`
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(task.id)
      setTimeout(() => setCopiedId(null), 2000) // Reset after 2 seconds
    })
  }

  const totalWeeklyHours = Object.values(weeklyStats).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-sans">
      
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black italic tracking-tighter uppercase">BIIK <span className="text-blue-500 font-mono">2.0</span></h1>
          {userEmail === "jayvimp@gmail.com" && (
            <button 
              onClick={() => window.location.href = "/admin"}
              className="text-[9px] bg-blue-600/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-lg"
            >
              Terminal Admin
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-[#141414] p-1 rounded-2xl border border-[#222]">
            {clients.map(c => (
              <button 
                key={c} 
                onClick={() => setActiveClient(c)} 
                className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${activeClient === c ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"}`}
              >
                {c.split('_')[1]}
              </button>
            ))}
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = "/"; }}
            className="text-[9px] text-gray-700 font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-[#141414] p-8 rounded-3xl border border-[#222] flex flex-col items-center shadow-lg">
          <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-4">Active: {activeClient.split('_')[1]}</p>
          <input 
            type="text" 
            placeholder="What are you working on?" 
            value={taskName} 
            onChange={e => setTaskName(e.target.value)} 
            className="bg-transparent text-center text-lg mb-6 outline-none border-b border-[#222] w-full pb-2 focus:border-blue-500 transition-colors" 
          />
          <div className="text-7xl font-mono font-black mb-8 tracking-tighter tabular-nums">
            {Math.floor(seconds / 3600).toString().padStart(2, '0')}:{Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}:{ (seconds % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={toggleTimer} className={`flex-1 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all ${isActive ? "bg-red-900/20 text-red-500 border border-red-900/50" : "bg-white text-black"}`}>
              {isActive ? "Stop" : "Start"}
            </button>
            {!isActive && seconds > 0 && (
              <button onClick={handleFinish} className="flex-1 py-4 rounded-2xl font-bold bg-blue-600 uppercase text-xs tracking-widest hover:bg-blue-500 transition-all">Save Log</button>
            )}
          </div>
        </div>

        <div className="bg-[#141414] p-8 rounded-3xl border border-[#222] shadow-lg">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase mb-1 tracking-widest">Weekly Total ({activeClient.split('_')[1]})</p>
              <p className="text-4xl font-black">{totalWeeklyHours.toFixed(1)}h</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Goal</p>
                <p className="text-xs text-gray-500 font-bold">20.0h</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden mb-8">
            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.min((totalWeeklyHours / 20) * 100, 100)}%` }} />
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Object.entries(weeklyStats).map(([day, val]) => (
              <div key={day} className="text-center py-3 bg-[#0a0a0a] rounded-xl border border-[#222]">
                <p className="text-[8px] text-gray-600 uppercase font-black mb-1">{day}</p>
                <p className={`text-[10px] font-bold ${val > 0 ? "text-blue-500" : "text-gray-800"}`}>{Number(val).toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-[#141414] rounded-3xl border border-[#222] overflow-hidden shadow-2xl">
        <div className="px-8 py-5 border-b border-[#222] flex justify-between items-center">
            <h2 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{activeClient.split('_')[1]} Recent Activity</h2>
            <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)} 
                className="bg-[#0a0a0a] text-[10px] font-bold border border-[#333] rounded-lg px-2 py-1 outline-none text-gray-400"
            />
        </div>
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-[#1e1e1e]">
            {tasks.length > 0 ? tasks.map((t) => (
              <tr key={t.id} className="hover:bg-[#1a1a1a] group transition-colors">
                <td className="px-8 py-5 text-gray-300 font-medium group-hover:text-white transition-colors">{t.task_name}</td>
                <td className="px-8 py-5 text-blue-500 font-black font-mono">{t.duration_hours}h</td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => copyToClipboard(t)}
                    className={`text-[8px] border px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest transition-all ${copiedId === t.id ? "border-green-500 text-green-500" : "border-[#333] text-gray-600 hover:border-blue-500 hover:text-blue-500"}`}
                  >
                    {copiedId === t.id ? "Copied!" : "Copy"}
                  </button>
                </td>
                <td className="pr-8 py-5 text-gray-700 text-right font-bold text-[10px] uppercase tracking-tighter">{new Date(t.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="px-8 py-10 text-center text-gray-600 italic text-xs tracking-widest uppercase">No data for this client yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}