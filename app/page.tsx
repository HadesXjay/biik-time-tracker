"use client"
import { useState } from "react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Use the exact names your Google Script expects
    const user = email.trim(); // Your script compares directly, so we keep casing as is
    const pass = password.trim();

    try {
      // Matches your function login(e) { const email = e.parameter.email; ... }
      const res = await fetch(`${API_URL}?action=login&email=${user}&password=${pass}`);
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("email", user);
        
        // Admin routing logic
        // Since your script returns {success: true, name: ...}, we check the email here
        if (user.toLowerCase() === "jayvimp@gmail.com") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        alert("Login failed. Please check your credentials or if your account is 'ACTIVE'.");
      }
    } catch (err) {
      alert("Connection error. Ensure your Google Script is deployed as 'Anyone'.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="bg-[#141414] p-10 rounded-3xl border border-[#222] w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-4xl">🐷</span>
          <h1 className="text-xl font-black uppercase tracking-tighter mt-2 text-white">Biik Tracker</h1>
        </div>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Username or Email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full bg-[#0a0a0a] border border-[#333] p-4 rounded-xl text-white outline-none focus:border-blue-500 transition-all" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full bg-[#0a0a0a] border border-[#333] p-4 rounded-xl text-white outline-none focus:border-blue-500 transition-all" 
          />
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-xs"
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  )
}