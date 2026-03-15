"use client"
import { useEffect, useState } from "react"

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    // Check if user is logged in
    const email = localStorage.getItem("email")
    if (!email) {
      window.location.href = "/" // Send back to login if not found
    } else {
      setUserEmail(email)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("email")
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      {/* 🔝 Header Section */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🐷</span> Biik Tracker
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{userEmail}</span>
          <button 
            onClick={handleLogout}
            className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded-lg border border-red-900/50 hover:bg-red-900/50"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* 📊 Main Dashboard Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ⏱️ Timer Placeholder */}
        <div className="bg-[#1e1e1e] p-8 rounded-3xl border border-[#333] flex flex-col items-center justify-center min-h-[250px]">
          <h2 className="text-gray-400 uppercase tracking-widest text-sm mb-4">Current Session</h2>
          <div className="text-6xl font-mono font-black mb-6">00:00:00</div>
          <button className="bg-white text-black w-full py-4 rounded-xl font-bold hover:bg-gray-200">
            START TRACKING
          </button>
        </div>

        {/* 📝 Task/Daily Total Placeholder */}
        <div className="bg-[#1e1e1e] p-8 rounded-3xl border border-[#333]">
          <h2 className="text-gray-400 uppercase tracking-widest text-sm mb-4">Today's Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-[#333] pb-2">
              <span>Total Hours:</span>
              <span className="font-bold text-green-400">0.0h</span>
            </div>
            <div className="flex justify-between border-b border-[#333] pb-2">
              <span>Tasks Completed:</span>
              <span className="font-bold">0</span>
            </div>
            <p className="text-xs text-gray-500 mt-4 italic">
              "Great things are done by a series of small things brought together."
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
