// Convert time string (hh:mm:ss or mm:ss) to total seconds
export function timeStringToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  // Handle mm:ss format
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  // Handle hh:mm:ss format
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

// Format seconds into a human-readable time string (hh:mm:ss or mm:ss)
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  // Only show hours if present, pad minutes and seconds with zeros
  return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Calculate VDOT (VO2max estimate) using Daniels' Running Formula
export function calculateVDOT(raceDistance: number, raceTime: number): number {
  // Calculate velocity in meters per second
  const velocity = raceDistance / raceTime;
  
  // Calculate percent of VO2max using Daniels' formula
  const percentVO2Max = -4.6 + 0.182258 * velocity + 0.000104 * velocity ** 2;
  
  // Apply correction factors based on race duration
  return percentVO2Max / (0.8 + 0.1894393 * Math.exp(-0.012778 * raceTime) + 0.2989558 * Math.exp(-0.1932605 * raceTime));
}