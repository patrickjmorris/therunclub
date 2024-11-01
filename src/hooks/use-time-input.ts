import { useState } from "react";
import { FieldValues, Path, PathValue, UseFormSetValue } from "react-hook-form";

interface UseTimeInputProps<TFormValues extends FieldValues> {
  setValue: UseFormSetValue<TFormValues>;
  fieldName: Path<TFormValues>;
  initialValue?: string;
}

export function useTimeInput<TFormValues extends FieldValues>({ setValue, fieldName, initialValue = "00:00" }: UseTimeInputProps<TFormValues>) {
  const [currentValue, setCurrentValue] = useState(initialValue);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

    e.preventDefault();
    
    const [minutes, seconds] = currentValue.split(":").map(Number);
    let newMinutes = minutes;
    let newSeconds = seconds;

    // Determine increment/decrement amount based on modifier keys
    const increment = e.shiftKey ? 5 : 1;

    if (e.key === "ArrowUp") {
      if (e.ctrlKey || e.metaKey) {
        // Increment minutes
        newMinutes += increment;
      } else {
        // Increment seconds
        newSeconds += increment;
        if (newSeconds >= 60) {
          newMinutes += Math.floor(newSeconds / 60);
          newSeconds = newSeconds % 60;
        }
      }
    } else if (e.key === "ArrowDown") {
      if (e.ctrlKey || e.metaKey) {
        // Decrement minutes
        newMinutes = Math.max(0, newMinutes - increment);
      } else {
        // Decrement seconds
        const totalSeconds = minutes * 60 + seconds;
        const newTotalSeconds = Math.max(0, totalSeconds - increment);
        newMinutes = Math.floor(newTotalSeconds / 60);
        newSeconds = newTotalSeconds % 60;
      }
    }

    const newValue = `${newMinutes.toString().padStart(2, "0")}:${newSeconds.toString().padStart(2, "0")}` as PathValue<TFormValues, Path<TFormValues>>;
    setCurrentValue(newValue);
    setValue(fieldName, newValue, { shouldValidate: true });
  };

  return {
    handleKeyDown,
    currentValue,
    setCurrentValue,
  };
} 