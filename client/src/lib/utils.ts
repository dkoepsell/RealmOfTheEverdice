import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the D&D ability score modifier
 * @param score The ability score value (typically 3-20)
 * @returns The modifier value
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}
