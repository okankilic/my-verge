# Plan form fields by verb

This page describes which fields the new-plan form shows for each verb, and in what order. The code that applies it is `FIELD_SHAPES`, `VERB_SHAPE` and `REMINDER_DEFAULTS` in `src/data/categories.ts`. Keep the two in sync.

Category and Title always come first, with a short hint about the verb under the category grid. Each verb then uses one of five shapes and shows only that shape's fields, in that order. Notes always comes last. A field that isn't listed is hidden.

| Shape | After Title, in order | Verbs |
|---|---|---|
| place | Where, When, Before you start, Along the way, Budget, Reminder, Link, Notes | Go, Try |
| media | When, Author + format, Link, Notes | Read, Watch (Director), Listen (Artist) |
| project | When, Before you start, Along the way, Budget, Reminder, Link, Notes | Learn, Workout, Cook, Collect, Do |
| errand | When, Reminder, Budget, Link, Notes | Buy, Call, Give |
| date | Reminder, Budget, Link, Notes | Pay (reminder on, Monthly), Remember (reminder on, Yearly) |
| `custom-*` / unknown | When, Author + format, Notes, Link, Where, Before you start, Along the way, Reminder, Budget | |

Plans from retired verbs move on load (`MERGED_VERBS`): Visit and See to Go, Taste and Play to Try, Research to Learn, Send to Give, Fix to Do.

## Rules

- **Hidden fields that already hold a value still show.** They appear at the end, in the default order. This happens when you edit an older plan, or switch verbs after typing into a field, and it means saved data is never invisible.
- **No When:** a new plan from a verb that doesn't list When (Pay, Remember) saves as Someday. Editing a plan keeps its stored When.
- **Reminder defaults:** on a new plan, picking Pay or Remember while the reminder is off turns it on, with Repeat set to Monthly or Yearly and the next matching date.
- **Past** hides Reminder and Before you start, whatever the verb lists.

## Example: a birthday

1. Tap `+`, then **Remember**. The form shows Title, then a Reminder card that's already on with Repeat set to Yearly, then Budget, Link and Notes.
2. Type "Mom's birthday", pick March and 14 (the time defaults to 09:00), and tap **Save**.

The plan saves as Someday and alerts you every March 14 from the Horizon.
