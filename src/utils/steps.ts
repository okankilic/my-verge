import { WishStep } from '../types';

export function stepProgress(steps: WishStep[] | undefined): { done: number; total: number } {
  const list = steps ?? [];
  return { done: list.filter((s) => s.doneAt).length, total: list.length };
}

export function newStep(title: string): WishStep {
  return { id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`, title };
}

// Ticks or unticks one step
export function toggleStep(steps: WishStep[], stepId: string): WishStep[] {
  return steps.map((s) =>
    s.id === stepId ? { ...s, doneAt: s.doneAt ? undefined : new Date().toISOString() } : s
  );
}
