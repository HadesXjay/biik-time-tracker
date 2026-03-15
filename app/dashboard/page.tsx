"use client"
import { useEffect, useState, useRef } from "react"

interface Task {
  task: string;
  total: string | number;
  date: string;
  taskId?: string;
}

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("")
  const [taskName, setTaskName] = useState("")
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA')) 
  const [tasks, setTasks] = useState<Task[]>([])
  const [weeklyStats, setWeeklyStats] = useState<Record<string, number>>({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 })
  const [loading, setLoading] = useState(false)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // --- NEW LOGIC START ---
  
  // This function calculates how much time has passed since the "sticky note" was created
  const syncTimerFromStorage = () => {
    const savedStart = localStorage.getItem("biik_timer_start");
    if (savedStart && isActive) {
      const elapsed = Math.floor((Date.now() - parseInt(savedStart)) / 1000);
      setSeconds(elapsed);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      // Keep the UI ticking every second while she's looking at it
      interval = setInterval(syncTimerFromStorage, 1000);
    }

    // This wakes the app up when she unlocks her phone or returns to the tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") syncTimerFromStorage();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isActive]);

  // --- NEW LOGIC END ---

  const totalWeeklyHours = Object.values(weeklyStats).reduce((a, b) => Number(a) + Number(b), 0);

  const refreshData = async (email: string) => {
    if (!API_URL || !email) return;
    setLoading(true);
    try {
      const [tRes, wRes] = await Promise.all([
        fetch(`${API_URL}?action=tasks&email=${email}`),
        fetch(`${API_URL}?action=getWeeklySummary&email=${email}`)
      ]);
      const taskData = await tRes.json();
      const weeklyData = await wRes.json();
      setTasks(Array.isArray(taskData) ? taskData : []);
      setWeeklyStats(weeklyData || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 });
    } catch (e) { console.error("Sync error:", e); } finally { setLoading(false); }
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) { 
      window.location.href = "/"; 
    } else { 
      setUserEmail(email); 
      refreshData(email); 
      
      // Check if a timer was already running before the page reloaded
      const savedStart = localStorage.getItem("biik_timer_start");
      if (savedStart) {
        setIsActive(true);
        syncTimerFromStorage();
      }
    }
  }, []);

  const toggleTimer = () => {
    if (isActive) { 
      // PAUSE: We keep the seconds but remove the start timestamp
      localStorage.removeItem("biik_timer_start");
      setIsActive(false); 
    } else { 
      // START: Create the "sticky note"
      // If we are resuming, we set the start time back in the past so the math stays correct
      const startTime = Date.now() - (seconds * 1000);
      localStorage.setItem("biik_timer_start", startTime.toString());
      setIsActive(true); 
    }
  };

  const handleFinish = async () => {
    if (seconds < 1 || !API_URL) return;
    const hours = (seconds / 3600).toFixed(2);
    setLoading(true);
    try {
      await fetch(`${API_URL}?action=addTask`, {
        method: 'POST',
        body: JSON.stringify({ email: userEmail, task: taskName || "Untitled Task", total: hours, date: selectedDate })
      });
      // CLEANUP
      localStorage.removeItem("biik_timer_start");
      setSeconds(0); 
      setTaskName(""); 
      setIsActive(false);
      refreshData(userEmail);
    } catch (e) { 
      console.error("Error saving task:", e); 
      alert("Failed to save. Check your connection!");
    } finally {
      setLoading(false);
    }
  };

  // ... (Keep the rest of your return/JSX exactly as it was)