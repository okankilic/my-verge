# Plan form fields by verb

This page describes which fields the new-plan form shows for each verb, and in what order. The code that applies it is `FIELD_SHAPES`, `VERB_SHAPE` and `REMINDER_DEFAULTS` in `src/data/categories.ts`. Keep the two in sync.

Category and Title always come first, with a short hint about the verb under the category grid. Each verb then uses one of five shapes and shows only that shape's fields, in that order. Notes always comes last. A field that isn't listed is hidden.

| Shape | After Title, in order | Verbs |
|---|---|---|
| place | Where, Horizon, Before you start, Along the way, Budget, Reminder, Link, Notes | Go, Try |
| media | Horizon, Author + format, Link, Notes | Read, Watch (Director), Listen (Artist) |
| project | Horizon, Before you start, Along the way, Budget, Reminder, Link, Notes | Learn, Workout, Cook, Collect, Do |
| errand | Horizon, Reminder, Budget, Link, Notes | Buy, Call, Give |
| date | Reminder, Budget, Link, Notes | Pay (reminder on, Monthly), Remember (reminder on, Yearly) |
| `custom-*` / unknown | Horizon, Author + format, Notes, Link, Where, Before you start, Along the way, Reminder, Budget | |

Plans from retired verbs move on load (`MERGED_VERBS`): Visit and See to Go, Taste and Play to Try, Research to Learn, Send to Give, Fix to Do.

## Rules

- **Hidden fields that already hold a value still show.** They appear at the end, in the default order. This happens when you edit an older plan, or switch verbs after typing into a field, and it means saved data is never invisible.
- **No Horizon:** a new plan from a verb that doesn't list Horizon (Pay, Remember) saves as Someday. Editing a plan keeps its stored date.
- **Horizon presets** (optional for every verb, starting on Someday; saved as an Until date): Today, Tomorrow, This week (its Sunday), This month (its last day), This year (Dec 31) plus In a year, In five years and In ten years (the same day 1, 5 or 10 years ahead, month ends clamped) each fill in a fixed date, shown in the Target date field where it can be changed; Pick a date sets your own, and Someday saves no date. Dated plans sit on the Horizon timeline and the rest in its Someday group.
- **Required reminder:** Pay and Remember always have a reminder, with no on/off switch. A new plan (or switching to either verb) starts it with Repeat set to Monthly or Yearly and the next matching date; editing an older one without a reminder fills it in the same way. Leaving the verb on a new plan takes an untouched default back.

## Example: a birthday

1. Tap `+`, then **Remember**. The form shows Title, then a Reminder card that's already on with Repeat set to Yearly, then Budget, Link and Notes.
2. Type "Mom's birthday", pick March and 14 (the time defaults to 09:00), and tap **Save**.

The plan saves as Someday and alerts you every March 14 from the Horizon.
