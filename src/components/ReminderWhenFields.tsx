import React from 'react';
import { RecurrenceType } from '../types';
import { maxDaysInMonth, nextReminderDate, readReminderParts, ReminderParts } from '../utils/reminderFields';

interface ReminderWhenFieldsProps {
  recurrence: RecurrenceType;
  value: string;
  onChange: (value: string) => void;
}

export const fieldClass =
  'w-full min-h-[44px] px-3 py-1.5 text-xs bg-paper border border-ink/15 rounded-lg text-ink focus:outline-none focus:border-ink';
export const fieldLabelClass = 'block text-[11px] text-ink/60 font-medium mb-1';

// January 1, 2024 was a Monday, so the list runs Monday first
const WEEKDAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(2024, 0, 1 + i);
  return { value: d.getDay(), label: d.toLocaleDateString(undefined, { weekday: 'long' }) };
});
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: new Date(2024, i, 1).toLocaleDateString(undefined, { month: 'long' }),
}));
const dayOptions = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <option key={i + 1} value={i + 1}>
      {i + 1}
    </option>
  ));

// The reminder's when, shaped by Repeat. Every view edits the same reminder date string.
export const ReminderWhenFields: React.FC<ReminderWhenFieldsProps> = ({ recurrence, value, onChange }) => {
  if (recurrence === 'none') {
    return (
      <div>
        <label htmlFor="item-reminder-date" className={fieldLabelClass}>
          Date & time
        </label>
        <input
          id="item-reminder-date"
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className={fieldClass}
        />
      </div>
    );
  }

  const parts = readReminderParts(value);
  const update = (patch: Partial<ReminderParts>) => onChange(nextReminderDate(recurrence, { ...parts, ...patch }));

  const select = (
    id: string,
    label: string,
    current: number,
    key: 'weekday' | 'day' | 'month',
    options: React.ReactNode
  ) => (
    <div>
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      <select
        id={id}
        value={current}
        onChange={(e) => {
          const next = Number(e.target.value);
          // A shorter month pulls the day back so the list and the date agree
          update(key === 'month' ? { month: next, day: Math.min(parts.day, maxDaysInMonth(next)) } : { [key]: next });
        }}
        className={fieldClass}
      >
        {options}
      </select>
    </div>
  );

  const columns =
    recurrence === 'daily' ? 'grid-cols-1' : recurrence === 'yearly' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2';

  return (
    <div className={`grid gap-3 ${columns}`}>
      {recurrence === 'weekly' &&
        select(
          'item-reminder-weekday',
          'Day',
          parts.weekday,
          'weekday',
          WEEKDAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))
        )}
      {recurrence === 'monthly' && select('item-reminder-day', 'Day of month', parts.day, 'day', dayOptions(31))}
      {recurrence === 'yearly' &&
        select(
          'item-reminder-month',
          'Month',
          parts.month,
          'month',
          MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))
        )}
      {recurrence === 'yearly' &&
        select('item-reminder-day', 'Day', parts.day, 'day', dayOptions(maxDaysInMonth(parts.month)))}
      <div className={recurrence === 'yearly' ? 'col-span-2 sm:col-span-1' : undefined}>
        <label htmlFor="item-reminder-time" className={fieldLabelClass}>
          Time
        </label>
        <input
          id="item-reminder-time"
          type="time"
          value={parts.time}
          // A repeating reminder always keeps a time, so clearing the field is ignored
          onChange={(e) => e.target.value && update({ time: e.target.value })}
          required
          className={fieldClass}
        />
      </div>
    </div>
  );
};
