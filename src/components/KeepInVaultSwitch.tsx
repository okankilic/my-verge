import React from 'react';
import { Archive, EyeOff, LucideIcon } from 'lucide-react';

interface SettingSwitchProps {
  checked: boolean;
  onToggle: () => void;
  icon: LucideIcon;
  label: string;
  onText: string;
  offText: string;
}

// Full-row switch, so the whole line is the touch target
export const SettingSwitch: React.FC<SettingSwitchProps> = ({
  checked,
  onToggle,
  icon: Icon,
  label,
  onText,
  offText,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onToggle}
    className="w-full min-h-[44px] px-3.5 py-2 flex items-center justify-between gap-3 bg-card border border-ink/15 rounded-xl text-left"
  >
    <span className="flex items-center gap-2.5 min-w-0">
      <Icon className="w-4 h-4 shrink-0 text-ink/60" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-[11px] text-ink/55">{checked ? onText : offText}</span>
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

interface SwitchProps {
  checked: boolean;
  onToggle: () => void;
}

export const KeepInVaultSwitch: React.FC<SwitchProps> = (props) => (
  <SettingSwitch
    {...props}
    icon={Archive}
    label="Keep in Vault"
    onText="Stays on your Vault shelves."
    offText="Leaves the Vault once finished."
  />
);

export const HideInMemoriesSwitch: React.FC<SwitchProps> = (props) => (
  <SettingSwitch
    {...props}
    icon={EyeOff}
    label="Hide in Memories"
    onText="Left off your Memories timeline."
    offText="Shows on your Memories timeline."
  />
);
