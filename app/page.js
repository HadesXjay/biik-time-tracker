"use client"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabaseClient"

export default function Home() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const userEmail = session.user.email
        localStorage.setItem("email", userEmail)
        
        if (userEmail === "jayvimp@gmail.com") {
          window.location.href = "/admin"
        } else {
          window.location.href = "/dashboard"
        }
      } else {
        setCheckingSession(false)
      }
    }
    checkUser()
  }, [])

  const handleClockIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    const normalizedEmail = email.toLowerCase().trim()

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password,
      })

      if (authError) {
        await supabase.from('login_attempts').insert([{ attempted_email: normalizedEmail, status: 'INVALID_CREDENTIALS' }])
        throw authError
      }

      const { data: authorized } = await supabase
        .from('authorized_users')
        .select('email')
        .eq('email', normalizedEmail)
        .single()

      if (!authorized) {
        await supabase.from('login_attempts').insert([{ attempted_email: normalizedEmail, status: 'DENIED' }])
        await supabase.auth.signOut()
        alert("Access Denied: Station not authorized.")
        return
      }

      await supabase.from('login_attempts').insert([{ attempted_email: normalizedEmail, status: 'SUCCESS' }])
      localStorage.setItem("email", normalizedEmail)
      
      if (normalizedEmail === "jayvimp@gmail.com") {
        window.location.href = "/admin"
      } else {
        window.location.href = "/dashboard"
      }

    } catch (err) {
      alert(err.message || "Connection failed. Check credentials.")
    } finally {
      setTimeout(() => setLoading(false), 1500)
    }
  }

  if (loading || checkingSession) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
      <style jsx>{`
        @keyframes biik-bounce {
          0%, 100% { transform: scale(1, 1) translateY(0); }
          50% { transform: scale(1.1, 0.9) translateY(10px); }
        }
        .biik-pig { animation: biik-bounce 0.6s infinite ease-in-out; filter: drop-shadow(0 20px 30px rgba(59, 130, 246, 0.3)); }
        .shadow-pulse { animation: shadow-size 0.6s infinite ease-in-out; background: rgba(255,255,255,0.05); height: 10px; border-radius: 50%; margin-top: 20px; }
        @keyframes shadow-size { 0%, 100% { width: 40px; opacity: 0.2; } 50% { width: 60px; opacity: 0.5; } }
      `}</style>
      <div className="flex flex-col items-center">
        <div className="text-6xl biik-pig">🐷</div>
        <div className="shadow-pulse"></div>
        <p className="mt-8 text-[10px] font-black text-blue-500 uppercase tracking-[0.6em] animate-pulse">Authenticating...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans text-white">
      <div className="w-full max-w-sm text-center">
        <div className="mb-12">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Ready to <span className="text-blue-500">Clock In?</span></h1>
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.3em] mt-3">BIIK Systems // Terminal 01</p>
        </div>
        <form onSubmit={handleClockIn} className="bg-[#141414] p-10 rounded-[45px] border border-[#222] shadow-2xl relative overflow-hidden text-left">
          <div className="space-y-4 relative">
            <input type="email" placeholder="Operator ID" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#222] p-4 rounded-2xl text-white outline-none focus:border-blue-500 text-sm" />
            <input type="password" placeholder="Access Key" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#222] p-4 rounded-2xl text-white outline-none focus:border-blue-500 text-sm" />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-[11px] shadow-lg shadow-blue-900/40 mt-4">Confirm & Clock In</button>
          </div>
        </form>
        <p className="mt-10 text-[8px] text-gray-800 font-bold uppercase tracking-widest">Secured by Hades Tech</p>
      </div>
    </div>
  )
}