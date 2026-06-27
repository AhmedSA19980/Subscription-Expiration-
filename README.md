# Subscription-Expiration-





 Subscription Expiration Logic with Status Badges, Grace Period, Threshold Rules, and Real Date Handling (Modern UI)




 🧩 Project Overview

This is a single-page subscription rules simulator with a split layout:
🔹 Left side: inputs + business rule toggles (plan, grace, threshold, mode).
🔹 Right side: results panel showing status badge, end date, grace end, and final valid-until date.

It’s designed to mimic real SaaS logic used in course platforms, memberships, and billing systems.



🧬 Core Concepts
🔹 Date-Only Logic (Timezone-Safe)
➡️ All comparisons are done using “date only” values (midnight).
➡️ Prevents time-of-day and timezone offsets from breaking expiration rules.

🔹 Plan End Date Calculation (Two Modes)
➡️ Fixed-days mode: weekly/monthly/quarterly/yearly are treated as 7/30/90/365 days.
➡️ Calendar-based mode: monthly = +1 real month, quarterly = +3 months, yearly = +1 year.

🔹 Inclusive vs Exclusive End Date
➡️ Inclusive ✅ means the user is still valid on the end date itself.
➡️ Exclusive ❌ means validity ends the day before the end date.

🔹 Grace Period Handling
➡️ After expiration, the user can remain “IN GRACE” 🕒 for a set number of days.
➡️ Useful for real systems (late renewal, payment retries, support exceptions).

🔹 Expiring Soon Threshold
➡️ If days left ≤ threshold, status becomes “EXPIRING SOON” ⚠️.
➡️ This simulates renewal reminders and warning banners.

🔹 Status Decision Engine (Business Rules)
➡️ ACTIVE ✅ if today is within valid range.
➡️ EXPIRING SOON ⚠️ if active but close to end.
➡️ IN GRACE 🕒 if expired but still within grace window.
➡️ EXPIRED ❌ if outside both validity and grace.

🔹 Clear UI Feedback + Badges
➡️ A badge shows the status type with matching colors.
➡️ A message box explains what the result means in plain language.

🔹 Demo + Reset Workflow
➡️ “Demo” fills realistic values (start 20 days ago + grace + thresholds).
➡️ “Clear” resets rules and outputs for clean retesting.

