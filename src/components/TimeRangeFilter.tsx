import React from 'react';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import { TimeRange, rangeLabel } from '../utils/timeRange';
import { Sheet } from './Sheet';

interface TimeRangeFilterProps {
  range: TimeRange;
  options: TimeRange[];
  onChange: (range: TimeRange) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  // e.g. "Filter the Vault by time"; the picked range is appended
  ariaLabel: string;
  sheetTitle: string;
  // Unique per page, for the sheet's heading id
  id: string;
}

// Right-aligned time button (shows the picked range, Clear beside it) and its sheet of ranges.
// The Vault and the Horizon use it; App.tsx owns the range and the open flag.
export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
  range,
  options,
  onChange,
  isOpen,
  onOpen,
  onClose,
  ariaLabel,
  sheetTitle,
  id,
}) => {
  const titleId = `${id}-range-title`;
  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {range !== 'all' && (
          <button
            type="button"
            onClick={() => onChange('all')}
            aria-label="Show plans from all time"
            className="min-h-[44px] px-2 text-xs text-ink/60 hover:text-ink"
          >
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-label={`${ariaLabel}: ${rangeLabel(range)}`}
          className={`min-h-[44px] px-3 shrink-0 flex items-center gap-1.5 text-xs font-medium bg-card border rounded-lg hover:border-ink/30 ${
            range === 'all' ? 'border-ink/15 text-ink/80' : 'border-ink/40 text-ink'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{rangeLabel(range)}</span>
          <ChevronDown aria-hidden className="w-3.5 h-3.5 text-ink/50" />
        </button>
      </div>

      <Sheet isOpen={isOpen} onClose={onClose} width="md" labelledBy={titleId}>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 border-b border-ink/10">
            <span id={titleId} className="font-serif-journal text-base text-ink">
              {sheetTitle}
            </span>
          </div>
          <div role="radiogroup" aria-labelledby={titleId} className="p-2">
            {options.map((option) => {
              const isSelected = option === range;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    onChange(option);
                    onClose();
                  }}
                  className={`w-full min-h-[44px] px-3 rounded-lg flex items-center justify-between text-sm text-left transition-colors ${
                    isSelected ? 'bg-paper-deep text-ink font-medium' : 'text-ink/80 hover:bg-paper'
                  }`}
                >
                  <span>{rangeLabel(option)}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>
      </Sheet>
    </>
  );
};
