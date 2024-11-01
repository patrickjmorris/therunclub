// World records in seconds for each distance (as of 2024)
export const WORLD_RECORDS = {
  mile: 3 * 60 + 43.13,     // Hicham El Guerrouj - 3:43.13
  "5k": 12 * 60 + 35.36,    // Joshua Cheptegei - 12:35.36
  "10k": 26 * 60 + 11.00,    // Joshua Cheptegei - 26:11.00
  "half-marathon": 57 * 60 + 30, // Yomif Kejelcha - 57:30
  marathon: 2 * 3600 + 0 * 60 + 35, // Kelvin Kiptum - 2:00:35
};

// Add 10% buffer to world records for validation
export const REALISTIC_THRESHOLDS = Object.entries(WORLD_RECORDS).reduce(
  (acc, [key, value]) => {
    acc[key] = value * 0.9; // 10% faster than world record
    return acc;
  },
  {} as Record<string, number>
);

interface ValidationResult {
  isValid: boolean;
  message?: string;
  warning?: string;
}

export function validateTime(distance: keyof typeof WORLD_RECORDS, timeInSeconds: number): ValidationResult {
  const worldRecord = WORLD_RECORDS[distance];
  const threshold = REALISTIC_THRESHOLDS[distance];

  // Check if time is faster than world record
  if (timeInSeconds < worldRecord) {
    return {
      isValid: false,
      message: `Time is faster than the world record for ${distance} (${formatTimeForDisplay(worldRecord)}).`,
    };
  }

  // Check if time is within realistic threshold
  if (timeInSeconds < threshold) {
    return {
      isValid: true,
      warning: `This is an extremely fast time, within 10% of the world record (${formatTimeForDisplay(worldRecord)}).`,
    };
  }

  return { isValid: true };
}

function formatTimeForDisplay(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(2);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
  }
  return `${minutes}:${secs.padStart(5, '0')}`;
} 