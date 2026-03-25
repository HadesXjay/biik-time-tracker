"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../Lib/supabaseClient"

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
  const [copiedId, setCopiedId] = useState(null)

  const clients = ["daphne_HVRCloud", "daphne_Lunarglow", "Hades_Personal"]

  const themes = {
    daphne_HVRCloud: {
      bg: "bg-[#cfa7a2]",
      card: "bg-[#FFFFFF]",
      text: "text-[#2e414d]",
      border: "border-[#2e414d]/10",
      accent: "bg-[#2e414d]",
      accentText: "text-[#2e414d]",
      tableHover: "hover:bg-[#f8f0ef]",
      inputBorder: "border-[#cfa7a2]",
      emojiGlow: "drop-shadow-[0_0_10px_rgba(255,105,180,0.4)]"
    },
    daphne_Lunarglow: {
      bg: "bg-[#cfa7a2]",
      card: "bg-[#FFFFFF]",
      text: "text-[#2e414d]",
      border: "border-[#2e414d]/10",
      accent: "bg-[#2e414d]",
      accentText: "text-[#2e414d]",
      tableHover: "hover:bg-[#f8f0ef]",
      inputBorder: "border-[#cfa7a2]",
      emojiGlow: "drop-shadow-[0_0_10px_rgba(255,105,180,0.4)]"
    },
    Hades_Personal: {
      bg: "bg-[#0a0a0a]",
      card: "bg-[#141414]",
      text: "text-white",
      border: "border-[#222]",
      accent: "bg-blue-600",
      accentText: "text-blue-500",
      tableHover: "hover:bg-[#1a1a1a]",
      inputBorder: "border-[#222]",
      emojiGlow: "drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"
    }
  }

  const currentTheme = themes[activeClient] || themes.Hades_Personal

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
        if (start) {
          setSeconds(Math.floor((Date.now() - start) / 1000))
        }
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isActive])

  const refreshData = async (email, client) => {
    setLoading(true)
    
    try {
      // CLEAN WEEK CALCULATION (Prevents Timezone Issues)
      const baseDate = new Date(selectedDate);
      baseDate.setHours(12, 0, 0, 0); // Set to noon to avoid day-skipping
      
      const day = baseDate.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      
      const monday = new Date(baseDate);
      monday.setDate(baseDate.getDate() + diffToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const weekStart = monday.toISOString().split('T')[0];
      const weekEnd = sunday.toISOString().split('T')[0];

      // 1. Fetch TABLE data: Using the range GTE/LTE
      const { data, error } = await supabase.from('activity_logs')
        .select('*')
        .eq('email', email)
        .eq('username', client)
        .gte('target_date', weekStart)
        .lte('target_date', weekEnd)
        .order('target_date', { ascending: false })
      
      if (error) throw error
      setTasks(data || [])

      // 2. Fetch GOAL data (Current week only)
      const d = new Date()
      d.setHours(12, 0, 0, 0);
      const dDay = d.getDay()
      const dDiff = d.getDate() - dDay + (dDay === 0 ? -6 : 1)
      const currentMonday = new Date(d.setDate(dDiff)).toISOString().split('T')[0]

      const { data: weekData } = await supabase.from('activity_logs')
        .select('target_date, duration_hours')
        .eq('email', email)
        .eq('username', client)
        .gte('target_date', currentMonday)
      
      const stats = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
      weekData?.forEach(log => {
        const logDate = new Date(log.target_date + "T12:00:00"); // Force noon
        const dayName = logDate.toLocaleDateString('en-US', { weekday: 'short' })
        if (stats[dayName] !== undefined) stats[dayName] += Number(log.duration_hours)
      })
      setWeeklyStats(stats)
    } catch (err) {
      console.error("Refresh error:", err.message)
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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const formattedTime = parseFloat(`${h}.${m.toString().padStart(2, '0')}`);
    
    const { error } = await supabase.from('activity_logs').insert([{
      email: userEmail,
      username: activeClient,
      task_name: taskName || "Untitled Task",
      duration_hours: formattedTime,
      target_date: selectedDate
    }])

    if (!error) {
      localStorage.removeItem("biik_timer_start")
      setSeconds(0); setTaskName(""); setIsActive(false);
      refreshData(userEmail, activeClient);
    }
    setLoading(false)
  }

  const copyToClipboard = (task) => {
    const text = `${task.task_name} | ${Number(task.duration_hours).toFixed(2)} | ${task.target_date}`
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(task.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const totalWeeklyHours = Object.values(weeklyStats).reduce((a, b) => a + b, 0)

  return (
    <div className={`min-h-screen transition-all duration-500 p-6 font-sans ${currentTheme.bg} ${currentTheme.text}`}>
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black italic tracking-tighter uppercase">BIIK <span className={`${currentTheme.accentText} font-mono`}>2.0</span></h1>
          {userEmail === "jayvimp@gmail.com" && (
            <button onClick={() => window.location.href = "/admin"} className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest transition-all shadow-lg border ${activeClient.includes('Hades') ? "bg-blue-600/10 text-blue-500 border-blue-500/20" : "bg-[#2e414d]/10 text-[#2e414d] border-[#2e414d]/20"}`}>Terminal Admin</button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex p-1 rounded-2xl border ${currentTheme.card} ${currentTheme.border}`}>
            {clients.map(c => (
              <button key={c} onClick={() => setActiveClient(c)} className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${activeClient === c ? `${currentTheme.accent} text-white shadow-lg` : "opacity-50 hover:opacity-100"}`}>{c.split('_')[1]}</button>
            ))}
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="text-[9px] opacity-40 font-bold uppercase tracking-widest hover:text-red-500 transition-all">Log Out</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className={`${currentTheme.card} ${currentTheme.border} p-8 rounded-3xl border flex flex-col items-center shadow-lg`}>
          <div className="mb-4 flex flex-col items-center min-h-[80px] justify-center">
            <div className={`text-5xl ${isActive ? 'animate-biik-bounce' : 'opacity-20 grayscale'} ${currentTheme.emojiGlow}`}>🐷</div>
            {isActive && <div className="w-8 h-1 bg-black/10 rounded-full blur-sm mt-2 animate-pulse" />}
          </div>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${currentTheme.accentText}`}>Active: {activeClient.split('_')[1]}</p>
          <input type="text" placeholder="What are you working on?" value={taskName} onChange={e => setTaskName(e.target.value)} className={`bg-transparent text-center text-lg mb-6 outline-none border-b w-full pb-2 transition-colors ${currentTheme.inputBorder}`} />
          <div className="text-7xl font-mono font-black mb-8 tracking-tighter tabular-nums">
            {Math.floor(seconds / 3600).toString().padStart(2, '0')}:{Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={toggleTimer} className={`flex-1 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all ${isActive ? "bg-red-900/20 text-red-500 border border-red-900/50" : activeClient.includes('Hades') ? "bg-white text-black" : "bg-[#2e414d] text-white"}`}>
              {isActive ? "Stop" : "Start"}
            </button>
            {!isActive && seconds > 0 && (
              <button onClick={handleFinish} disabled={loading} className={`flex-1 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest text-white ${currentTheme.accent}`}>{loading ? "Saving..." : "Save Log"}</button>
            )}
          </div>
        </div>

        <div className={`${currentTheme.card} ${currentTheme.border} p-8 rounded-3xl border shadow-lg`}>
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[10px] opacity-50 font-black uppercase mb-1 tracking-widest">Weekly Total ({activeClient.split('_')[1]})</p>
              <p className="text-4xl font-black">{totalWeeklyHours.toFixed(2)}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] opacity-30 font-bold uppercase tracking-widest">Goal</p>
                <p className="text-xs opacity-50 font-bold">40.00</p>
            </div>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden mb-8 ${activeClient.includes('Hades') ? "bg-[#0a0a0a]" : "bg-gray-100"}`}>
            <div className={`h-full transition-all duration-1000 ${currentTheme.accent}`} style={{ width: `${Math.min((totalWeeklyHours / 40) * 100, 100)}%` }} />
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Object.entries(weeklyStats).map(([day, val]) => (
              <div key={day} className={`text-center py-3 rounded-xl border ${activeClient.includes('Hades') ? "bg-[#0a0a0a] border-[#222]" : "bg-gray-50 border-gray-100"}`}>
                <p className="text-[8px] opacity-40 uppercase font-black mb-1">{day}</p>
                <p className={`text-[10px] font-bold ${val > 0 ? currentTheme.accentText : "opacity-20"}`}>{Number(val).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${currentTheme.card} ${currentTheme.border} max-w-4xl mx-auto rounded-3xl border overflow-hidden shadow-2xl`}>
        <div className={`px-8 py-5 border-b flex justify-between items-center ${currentTheme.border}`}>
            <h2 className="text-[10px] font-black uppercase opacity-40 tracking-widest">Weekly Log View</h2>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={`text-[10px] font-bold border rounded-lg px-2 py-1 outline-none ${activeClient.includes('Hades') ? "bg-[#0a0a0a] border-[#333] text-gray-400" : "bg-white border-gray-200 text-[#2e414d]"}`} />
        </div>
        <table className="w-full text-left text-sm">
          <tbody className={`divide-y ${currentTheme.border}`}>
            {tasks.length > 0 ? tasks.map((t) => (
              <tr key={t.id} className={`${currentTheme.tableHover} group transition-colors`}>
                <td className="px-8 py-5 opacity-80 font-medium group-hover:opacity-100 transition-colors">{t.task_name}</td>
                <td className={`px-8 py-5 font-black font-mono ${currentTheme.accentText}`}>{Number(t.duration_hours).toFixed(2)}</td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => copyToClipboard(t)} className={`text-[8px] border px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${copiedId === t.id ? "border-green-500 text-green-500" : `border-transparent opacity-20 hover:opacity-100 hover:border-current`}`}>
                    {copiedId === t.id ? "Copied!" : "Copy"}
                  </button>
                </td>
                <td className="pr-8 py-5 opacity-30 text-right font-bold text-[10px] uppercase tracking-tighter">
                  {new Date(t.target_date + "T12:00:00").toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="px-8 py-10 text-center opacity-30 italic text-xs uppercase tracking-widest">No data for this week</td></tr>
            )}
          </tbody>
        </table>

        <div className={`px-8 py-4 border-t ${activeClient.includes('Hades') ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}>
          <div className="flex items-start gap-3">
            <div className={`${currentTheme.accentText} mt-1`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${currentTheme.accentText}`}>Time Reference</p>
              <p className="text-[11px] opacity-60 leading-relaxed mb-3">
                This log uses <span className="font-bold">Clock Format (H.MM)</span>. The decimal value represents total minutes, not a percentage of an hour.
              </p>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-[9px] font-black font-mono border ${activeClient.includes('Hades') ? "bg-black border-[#222] text-blue-500" : "bg-white border-gray-200 text-[#2e414d]"}`}>1.46 = 1h 46m</span>
                <span className={`px-2 py-1 rounded text-[9px] font-black font-mono border ${activeClient.includes('Hades') ? "bg-black border-[#222] text-blue-500" : "bg-white border-gray-200 text-[#2e414d]"}`}>2.05 = 2h 05m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}