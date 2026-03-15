"use client"
import { useState } from "react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "biik") {
      const formattedEmail = email.toLowerCase().trim();
      localStorage.setItem("email", formattedEmail);
      if (formattedEmail === "jayvimp@gmail.com") {
        window.location.href = "/admin"; 
      } else {
        window.location.href = "/dashboard"; 
      }
    } else {
      alert("Incorrect password, biik!")
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="bg-[#141414] p-10 rounded-3xl border border-[#222] w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8"><span className="text-4xl">🐷</span><h1 className="text-xl font-black uppercase tracking-tighter mt-2 text-white">Biik Tracker</h1></div>
        <div className="space-y-4">
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333] p-4 rounded-xl text-white outline-none focus:border-blue-500 transition-all" />
          <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333] p-4 rounded-xl text-white outline-none focus:border-blue-500 transition-all" />
          <button type="submit" className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-xs">Login</button>
        </div>
      </form>
    </div>
  )
}