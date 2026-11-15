# Plan form fields by verb

This page describes which fields the new-plan form shows for each verb, and in what order. The code that applies it is `FORM_FIELDS` and `REMINDER_DEFAULTS` in `src/data/categories.ts`. Keep the two in sync.

Category and Title always come first. Each verb then shows only the fields listed for it below, in that order. A field that isn't listed is hidden.

| Verb | After Title, in order |
|---|---|
| Go | Where, When, Before you start, Along the way, Budget, Reminder, Notes, Link |
| Visit | Where, When, Reminder, Notes |
| Workout | When, Along the way, Reminder, Notes |
| Buy | When, Link, Budget, Notes |
| Pay | Reminder (on, Monthly), Budget, Link, Notes |
| Remember | Reminder (on, Yearly), Notes |
| Read | When, Author + format, Link, Notes |
| Watch | When, Director + format, Link, Notes |
| Listen | When, Artist + format, Link, Notes |
| Cook | When, Before you start, Along the way, Link, Notes |
| Taste | When, Where, Link, Budget, Notes |
| Learn | When, Along the way, Link, Budget, Reminder, Notes |
| Research | When, Along the way, Link, Notes |
| See | When, Where, Link, Reminder, Notes |
| Try | When, Where, Before you start, Budget, Notes |
| Play | When, Where, Reminder, Notes |
| Call | When, Reminder, Notes |
| Send | When, Before you start, Reminder, Notes |
| Give | When, Budget, Reminder, Notes, Link |
| Fix | When, Before you start, Along the way, Budget, Notes |
| `custom-*` / unknown | When, Author + format, Notes, Link, Where, Before you start, Along the way, Reminder, Budget |

## Rules

- **Hidden fields that already hold a value still show.** They appear at the end, in the default order. This happens when you edit an older plan, or switch verbs after typing into a field, and it means saved data is never invisible.
- **No When:** a new plan from a verb that doesn't list When (Pay, Remember) saves as Someday. Editing a plan keeps its stored When.
- **Reminder defaults:** on a new plan, picking Pay or Remember while the reminder is off turns it on, with Repeat set to Monthly or Yearly and the next matching date.
- **Past** hides Reminder and Before you start, whatever the verb lists.

## Example: a birthday

1. Tap `+`, then **Remember**. The form shows Title, then a Reminder card that's already on with Repeat set to Yearly, then Notes.
2. Type "Mom's birthday", pick March and 14 (the time defaults to 09:00), and tap **Save**.

The plan saves as Someday and alerts you every March 14 from the Horizon.
