"use client"
import { useState } from "react"
import axios from "axios"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    // ✅ URL correctly wrapped in quotes
    const API_URL = "https://script.google.com/macros/s/AKfycbzCRZ-VcrexCdY-OPOrH0CInCby8MkLQB3SLnnB05TEPMkeOwFKVo1vddFssroeBxP-/exec";
    
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}?action=login&email=${email}&password=${password}`)
      if (res.data.success) {
        localStorage.setItem("email", email)
        window.location.href = "/dashboard"
      } else {
        alert("Invalid Login 🐷")
      }
    } catch (error) {
      alert("Check your connection or Script URL")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212]">
      <div className="bg-[#1e1e1e] p-10 rounded-3xl shadow-2xl border border-[#333] flex flex-col items-center gap-6 w-full max-w-sm">
        <h1 
          className="text-4xl font-black text-white flex items-center gap-2"
          style={{ textShadow: "2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000" }}
        >
          <span>🐷</span> Biik Tracker
        </h1>
        <div className="w-full flex flex-col gap-4">
          <input type="email" placeholder="Email" className="bg-[#2a2a2a] p-4 rounded-xl text-white" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="bg-[#2a2a2a] p-4 rounded-xl text-white" onChange={e => setPassword(e.target.value)} />
        </div>
        <button className="w-full bg-white text-black p-4 rounded-xl font-bold" onClick={handleLogin} disabled={loading}>
          {loading ? "LOGGING IN..." : "LOGIN"}
        </button>
      </div>
    </div>
  )
}