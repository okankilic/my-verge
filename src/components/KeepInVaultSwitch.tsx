import React from 'react';
import { Archive } from 'lucide-react';

interface KeepInVaultSwitchProps {
  checked: boolean;
  onToggle: () => void;
}

// Full-row switch, so the whole line is the touch target
export const KeepInVaultSwitch: React.FC<KeepInVaultSwitchProps> = ({ checked, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onToggle}
    className="w-full min-h-[44px] px-3.5 py-2 flex items-center justify-between gap-3 bg-card border border-ink/15 rounded-xl text-left"
  >
    <span className="flex items-center gap-2.5 min-w-0">
      <Archive className="w-4 h-4 shrink-0 text-ink/60" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">Keep in Vault</span>
        <span className="block text-[11px] text-ink/55">
          {checked ? 'Stays on your Vault shelves.' : 'Leaves the Vault once finished.'}
        </span>
      </span>
    </span>
    <span
      aria-hidden
      className={`relative w-10 h-6 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-[#4A6B56]' : 'bg-ink/20'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </span>
  </button>
);
