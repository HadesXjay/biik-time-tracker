"use client"
import { useState, useEffect } from "react"
import { supabase } from "../Lib/supabaseClient" // Change 'lib' to 'Lib'

export default function Home() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // Centralized redirect logic
  const handleRedirect = (userEmail) => {
    localStorage.setItem("email", userEmail)
    if (userEmail === "jayvimp@gmail.com") {
      window.location.href = "/admin"
    } else {
      window.location.href = "/dashboard"
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        handleRedirect(session.user.email)
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
        await supabase.from('login_attempts').insert([{ 
          attempted_email: normalizedEmail, 
          status: 'INVALID_CREDENTIALS' 
        }])
        throw authError
      }

      // Authorization Check
      const { data: authorized, error: authzError } = await supabase
        .from('authorized_users')
        .select('email')
        .eq('email', normalizedEmail)
        .single()

      if (!authorized || authzError) {
        await supabase.from('login_attempts').insert([{ 
          attempted_email: normalizedEmail, 
          status: 'DENIED' 
        }])
        await supabase.auth.signOut()
        alert("Access Denied: Station not authorized.")
        return
      }

      // Log Success and Redirect
      await supabase.from('login_attempts').insert([{ 
        attempted_email: normalizedEmail, 
        status: 'SUCCESS' 
      }])
      handleRedirect(normalizedEmail)

    } catch (err) {
      alert(err.message || "Connection failed. Check credentials.")
    } finally {
      // Delay slightly for smooth transition
      setTimeout(() => setLoading(false), 800)
    }
  }

  if (loading || checkingSession) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
      <style jsx>{`
        @keyframes biik-bounce {
          0%, 100% { transform: scale(1, 1) translateY(0); }
          50% { transform: scale(1.1, 0.9) translateY(15px); }
        }
        .biik-pig { 
          font-size: 64px;
          animation: biik-bounce 0.6s infinite ease-in-out; 
          filter: drop-shadow(0 10px 20px rgba(59, 130, 246, 0.4)); 
        }
        .shadow-pulse { 
          animation: shadow-size 0.6s infinite ease-in-out; 
          background: rgba(59, 130, 246, 0.1); 
          height: 8px; 
          border-radius: 50%; 
          margin-top: 15px; 
        }
        @keyframes shadow-size { 
          0%, 100% { width: 40px; opacity: 0.2; } 
          50% { width: 65px; opacity: 0.5; } 
        }
      `}</style>
      <div className="flex flex-col items-center">
        <div className="biik-pig">🐷</div>
        <div className="shadow-pulse"></div>
        <p className="mt-10 text-[9px] font-black text-blue-500 uppercase tracking-[0.8em] animate-pulse">
          Establishing Link
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans text-white">
      <div className="w-full max-w-sm text-center">
        <div className="mb-12">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">
            BIIK <span className="text-blue-500">2.0</span>
          </h1>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.4em] mt-3">
            Hades Tech // Terminal Authorization
          </p>
        </div>

        <form 
          onSubmit={handleClockIn} 
          className="bg-[#141414] p-10 rounded-[45px] border border-[#222] shadow-2xl relative overflow-hidden text-left"
        >
          <div className="space-y-4">
            <div className="group">
              <label className="text-[9px] uppercase font-black text-gray-600 ml-2 mb-2 block tracking-widest group-focus-within:text-blue-500 transition-colors">Operator ID</label>
              <input 
                type="email" 
                placeholder="name@email.com" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-[#0a0a0a] border border-[#222] p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all text-sm" 
              />
            </div>

            <div className="group">
              <label className="text-[9px] uppercase font-black text-gray-600 ml-2 mb-2 block tracking-widest group-focus-within:text-blue-500 transition-colors">Access Key</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-[#0a0a0a] border border-[#222] p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all text-sm" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-[11px] shadow-lg shadow-blue-900/40 mt-6 active:scale-[0.98] transition-all"
            >
              {loading ? "Decrypting..." : "Confirm & Clock In"}
            </button>
          </div>
        </form>
        
        <p className="mt-10 text-[8px] text-gray-800 font-bold uppercase tracking-widest">
          Secured by Hades Tech Internal Systems
        </p>
      </div>
    </div>
  )
}