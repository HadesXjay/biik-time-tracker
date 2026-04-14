"use client"
import { useEffect, useState, useRef } from "react"
import { supabase } from "../../Lib/supabaseClient"
import { toJpeg } from "html-to-image"

// --- INTERNAL EXPORT COMPONENT ---
// This lives inside the same file to prevent "Module Not Found" errors
function WeeklyLogExport({ logs, clientName }) {
  const reportRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!reportRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toJpeg(reportRef.current, { 
        quality: 1, 
        backgroundColor: '#ffffff',
        pixelRatio: 2 
      })
      const link = document.createElement('a')
      const name = clientName ? clientName.split('_')[1] : 'Log'
      link.download = `BIIK-Report-${name}-${new Date().toISOString().split('T')[0]}.jpg`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setIsExporting(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString + "T12:00:00")
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  }

  return (
    <div className="flex flex-col items-center w-full mt-8">
      <button 
        onClick={handleExport}
        disabled={isExporting || !logs?.length}
        className="mb-8 px-6 py-3 bg-[#2e414d] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1a252c] transition-all shadow-lg disabled:opacity-50"
      >
        {isExporting ? "Capturing..." : "Generate Image Report"}
      </button>

      <div className="overflow-x-auto w-full flex justify-center pb-8">
        <div ref={reportRef} className="w-[650px] bg-white border border-stone-200 p-10 font-sans text-[#1a1a1a]">
          <header className="flex justify-between items-end pb-6 border-b border-stone-200">
            <div>
              <h2 className="text-xl font-black italic tracking-tighter text-stone-800">BIIK</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-1">Weekly Log View</p>
            </div>
            <span className="text-[10px] font-bold border border-stone-200 bg-stone-50 rounded px-3 py-1.5 text-stone-500 uppercase tracking-widest">
              {clientName?.split('_')[1] || 'GENERAL'}
            </span>
          </header>

          <div className="divide-y divide-stone-100 min-h-[200px]">
            {logs?.length > 0 ? logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-4">
                <span className="text-sm font-medium text-stone-700 w-1/2 pr-4 truncate">{log.task_name}</span>
                <span className="font-mono text-lg font-black text-stone-900 w-1/4 text-center">{Number(log.duration_hours).toFixed(2)}</span>
                <span className="text-[10px] uppercase font-bold text-stone-400 w-1/4 text-right tracking-tighter">{formatDate(log.target_date)}</span>
              </div>
            )) : (
              <div className="py-10 text-center text-xs text-stone-400 italic uppercase">No logs found for this week.</div>
            )}
          </div>

          <footer className="mt-6 border-t border-stone-200 pt-6">
            <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mb-2">Time Reference</p>
            <div className="flex gap-4 text-[9px] text-stone-400 font-bold uppercase tracking-tighter">
              <span className="bg-stone-50 px-2 py-1 rounded">1.30 = 1h 30m</span>
              <span className="bg-stone-50 px-2 py-1 rounded">2.05 = 2h 05m</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

// --- MAIN DASHBOARD COMPONENT ---
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

  const WEEKLY_GOAL = 40.00 

  const clients = ["daphne_HVRCloud", "daphne_Lunarglow", "Hades_Personal"]
  const themes = {
    daphne: { bg: "bg-[#cfa7a2]", card: "bg-[#FFFFFF]", text: "text-[#2e414d]", border: "border-[#2e414d]/10", accent: "bg-[#2e414d]", emojiGlow: "drop-shadow-[0_0_10px_rgba(255,105,180,0.4)]" },
    hades: { bg: "bg-[#0a0a0a]", card: "bg-[#141414]", text: "text-white", border: "border-[#222]", accent: "bg-blue-600", emojiGlow: "drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" }
  }
  const currentTheme = activeClient.includes('Hades') ? themes.hades : themes.daphne

  useEffect(() => {
    const email = localStorage.getItem("email")
    if (!email) { 
      window.location.href = "/" 
    } else { 
      setUserEmail(email)
      refreshData(email, activeClient)
    }
  }, [activeClient, selectedDate])

  useEffect(() => {
    let interval = null
    if (isActive) {
      interval = setInterval(() => {
        const start = parseInt(localStorage.getItem("biik_timer_start"))
        if (start) setSeconds(Math.floor((Date.now() - start) / 1000))
      }, 1000)
    } else { 
      clearInterval(interval) 
    }
    return () => clearInterval(interval)
  }, [isActive])

  const refreshData = async (email, client) => {
    setLoading(true)
    try {
      const baseDate = new Date(selectedDate)
      baseDate.setHours(12, 0, 0, 0)
      const day = baseDate.getDay()
      const diffToMonday = day === 0 ? -6 : 1 - day
      const monday = new Date(baseDate)
      monday.setDate(baseDate.getDate() + diffToMonday)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)

      const { data, error } = await supabase.from('activity_logs')
        .select('*')
        .eq('email', email)
        .eq('username', client)
        .gte('target_date', monday.toISOString().split('T')[0])
        .lte('target_date', sunday.toISOString().split('T')[0])
        .order('target_date', { ascending: false })
      
      if (error) throw error
      setTasks(data || [])
      const stats = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
      data?.forEach(log => {
        const d = new Date(log.target_date + "T12:00:00").toLocaleDateString('en-US', { weekday: 'short' })
        if (stats[d] !== undefined) stats[d] += Number(log.duration_hours)
      })
      setWeeklyStats(stats)
    } catch (err) { 
      console.error(err) 
    } finally { 
      setLoading(false) 
    }
  }

  const toggleTimer = () => {
    if (isActive) {
      setIsActive(false)
    } else {
      localStorage.setItem("biik_timer_start", (Date.now() - (seconds * 1000)).toString())
      setIsActive(true)
    }
  }

  const handleFinish = async () => {
    if (seconds < 1) return
    setLoading(true)
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const { error } = await supabase.from('activity_logs').insert([{
      email: userEmail, 
      username: activeClient, 
      task_name: taskName || "Untitled Task",
      duration_hours: parseFloat(`${h}.${m.toString().padStart(2, '0')}`), 
      target_date: selectedDate
    }])
    if (!error) {
      localStorage.removeItem("biik_timer_start")
      setSeconds(0)
      setTaskName("")
      setIsActive(false)
      refreshData(userEmail, activeClient)
    }
    setLoading(false)
  }

  const totalWeeklyHours = Object.values(weeklyStats).reduce((a, b) => a + b, 0)

  return (
    <div className={`min-h-screen p-6 font-sans ${currentTheme.bg} ${currentTheme.text}`}>
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-xl font-black italic tracking-tighter uppercase">BIIK <span className="font-mono opacity-50">2.0</span></h1>
        <div className={`flex p-1 rounded-2xl border ${currentTheme.card} ${currentTheme.border}`}>
          {clients.map(c => (
            <button key={c} onClick={() => setActiveClient(c)} className={`px-4 py-2 rounded-xl text-[10px] font-bold ${activeClient === c ? `${currentTheme.accent} text-white shadow-lg` : "opacity-50"}`}>{c.split('_')[1]}</button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className={`${currentTheme.card} ${currentTheme.border} p-8 rounded-3xl border flex flex-col items-center shadow-lg`}>
          <div className={`text-5xl mb-4 ${isActive ? 'animate-bounce' : 'opacity-20'} ${currentTheme.emojiGlow}`}>🐷</div>
          <input type="text" placeholder="What are you working on?" value={taskName} onChange={e => setTaskName(e.target.value)} className="bg-transparent text-center text-lg mb-6 outline-none border-b w-full" />
          <div className="text-7xl font-mono font-black mb-8 tabular-nums">
            {Math.floor(seconds / 3600).toString().padStart(2, '0')}:{Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={toggleTimer} className={`flex-1 py-4 rounded-2xl font-bold uppercase text-xs ${isActive ? "bg-red-500 text-white" : "bg-[#2e414d] text-white"}`}>{isActive ? "Stop" : "Start"}</button>
            {!isActive && seconds > 0 && <button onClick={handleFinish} className={`flex-1 py-4 rounded-2xl font-bold uppercase text-xs text-white ${currentTheme.accent}`}>Save</button>}
          </div>
        </div>

        <div className={`${currentTheme.card} ${currentTheme.border} p-8 rounded-3xl border shadow-lg`}>
          <div className="flex justify-between items-end mb-6">
            <div><p className="text-[10px] opacity-50 font-black uppercase mb-1">Weekly Total</p><p className="text-4xl font-black">{totalWeeklyHours.toFixed(2)}</p></div>
            <div className="text-right"><p className="text-[10px] opacity-30 font-bold uppercase">Goal</p><p className="text-xs font-bold">{WEEKLY_GOAL.toFixed(2)}</p></div>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-100 mb-8">
            <div className={`h-full ${currentTheme.accent}`} style={{ width: `${Math.min((totalWeeklyHours / WEEKLY_GOAL) * 100, 100)}%` }} />
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Object.entries(weeklyStats).map(([day, val]) => (
              <div key={day} className="text-center py-3 rounded-xl border border-gray-100">
                <p className="text-[8px] opacity-40 uppercase font-black">{day}</p>
                <p className="text-[10px] font-bold">{val.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <WeeklyLogExport logs={tasks} clientName={activeClient} />
      </div>
    </div>
  )
}