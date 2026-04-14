// ... existing imports

// 1. Helper function goes here (outside the component)
const formatToClock = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  return `${hours}.${minutes.toString().padStart(2, '0')}`;
};

export default function Dashboard() {
  // ... your component logic
}