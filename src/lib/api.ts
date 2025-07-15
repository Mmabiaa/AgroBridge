const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function getHello() {
  const res = await fetch(`${API_URL}/`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

// Add more functions for other endpoints as you build them 