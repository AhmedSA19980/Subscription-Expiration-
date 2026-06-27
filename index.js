/* ============================================================
         ✅ Code Overview (Subscription Expiration Logic)
         ============================================================
         🔹 Purpose       → Determine subscription state (active/soon/expired/grace)
         🔹 Layout        → Left: rules & inputs | Right: status & dates
         🔹 Use Cases     → SaaS memberships, courses access, billing checks
         🔹 Key Properties→ End date calc, inclusive end, grace period, thresholds
      ============================================================ */

/* ============================================================
         ✅ 1) DOM Elements (Grab UI references once)
         ============================================================ */

// Inputs
const startDateInput = document.getElementById("startDate");
const planInput = document.getElementById("plan");
const graceDaysInput = document.getElementById("graceDays");
const soonDaysInput = document.getElementById("soonDays");

// Toggles
const inclusiveEndInput = document.getElementById("inclusiveEnd");
const fixedDaysModeInput = document.getElementById("fixedDaysMode");

// Buttons
const btnCheck = document.getElementById("btnCheck");
const btnDemo = document.getElementById("btnDemo");
const btnClear = document.getElementById("btnClear");

// UI feedback
const msgBox = document.getElementById("msgBox");
const statusChip = document.getElementById("statusChip");
const todayChip = document.getElementById("todayChip");
const badge = document.getElementById("badge");

// Outputs
const outEnd = document.getElementById("outEnd");
const outDaysLeft = document.getElementById("outDaysLeft");
const outGraceEnd = document.getElementById("outGraceEnd");
const outFinalValid = document.getElementById("outFinalValid");
const detailsLine = document.getElementById("detailsLine");

/* ============================================================
         ✅ 2) Helpers (small reusable functions)
         ============================================================ */

// Constant used to convert milliseconds to "days"
const msPerDay = 1000 * 60 * 60 * 24;

/**
 * ✅ stripTime(date)
 * Converts any Date into a "date-only" (midnight) Date.
 * This avoids time-zone / time-of-day bugs in comparisons.
 */
function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * ✅ parseDateInput(value)
 * Safely parses "YYYY-MM-DD" into a Date using (year, monthIndex, day).
 * We avoid new Date("YYYY-MM-DD") because it can shift due to timezone.
 */
function parseDateInput(value) {
  const [y, m, d] = value.split("-").map(Number);
  console.log( "y" +y + "m" +  m + " d " + d);
  return new Date(y, m - 1, d);


}

/**
 * ✅ formatDate(date)
 * Returns a friendly date string like "Dec 23, 2025".
 */
function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/**
 * ✅ showMessage(type, text)
 * type: "good" | "warn" | "bad" | "neutral"
 * Adds matching styling class and updates message text.
 */
function showMessageHelper(type, text ,element) {
  msgBox.classList.remove("good", "warn", "bad");
  if (type === "good") element.classList.add("good");
  if (type === "warn") element.classList.add("warn");
  if (type === "bad") element.classList.add("bad");
  element.textContent = text;
}

function showMessage(type, text) {
  showMessageHelper(type ,text, msgBox);



 /* msgBox.classList.remove("good", "warn", "bad");
  if (type === "good") msgBox.classList.add("good");
  if (type === "warn") msgBox.classList.add("warn");
  if (type === "bad") msgBox.classList.add("bad");
  msgBox.textContent = text;*/

}

/**
 * ✅ setStatus(text)
 * Updates the small status chip in the Results header.
 */
function setStatus(text) {
  statusChip.textContent = text;
}

/**
 * ✅ setBadge(type, text)
 * Updates the main "Status" badge (Active / Soon / Grace / Expired).
 */
function setBadge(type, text) {
   showMessageHelper(type, text, badge); 


  /*badge.classList.remove("good", "warn", "bad");
  if (type === "good") badge.classList.add("good");
  if (type === "warn") badge.classList.add("warn");
  if (type === "bad") badge.classList.add("bad");
  badge.textContent = text;*/
}

/**
 * ✅ resetOutputs()
 * Restores the Results panel to default state.
 */
function resetOutputs() {
  outEnd.textContent = "—";
  outDaysLeft.textContent = "—";
  outGraceEnd.textContent = "—";
  outFinalValid.textContent = "—";
  detailsLine.textContent = "Details: —";
  setBadge("neutral", "Status: —");
  setStatus("Waiting…");
}

/**
 * ✅ safeInt(value, fallback)
 * Ensures numeric inputs don't become NaN and never go negative.
 */
function safeInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

/* ============================================================
         ✅ 3) Date Math: Adding days / months / years
         ============================================================ */

/**
 * ✅ addDays(date, days)
 * Adds N days to a date using Date.setDate().
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * ✅ addCalendarMonths(date, months)
 * Adds months using calendar rules.
 * Example: Jan 31 + 1 month -> Feb 28/29 automatically.
 */
function addCalendarMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * ✅ addCalendarYears(date, years)
 * Adds years using calendar rules.
 * Example: Feb 29, 2024 + 1 year -> Feb 28, 2025 (auto-adjust).
 */
function addCalendarYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * ✅ computeEndDate(start, planValue, fixedDaysMode)
 * Core business rule: how do we compute an end date?
 *
 * If fixedDaysMode is ON:
 *   🔹 Weekly  = start + 7 days
 *   🔹 Monthly = start + 30 days
 *   🔹 etc...
 *
 * If fixedDaysMode is OFF (calendar-based):
 *   🔹 Weekly   => +7 days
 *   🔹 Monthly  => +1 calendar month
 *   🔹 Quarterly=> +3 calendar months
 *   🔹 Yearly   => +1 calendar year
 */
function computeEndDate(start, planValue, fixedDaysMode) {
  const planDays = Number(planValue);

  if (fixedDaysMode) {
    // ✅ Simple approach: always add N days
    return addDays(start, planDays);
  }

  // ✅ Calendar-based approach (more realistic for billing cycles)
  if (planDays === 7) return addDays(start, 7);
  if (planDays === 30) return addCalendarMonths(start, 1);
  if (planDays === 90) return addCalendarMonths(start, 3);
  if (planDays === 365) return addCalendarYears(start, 1);

  // Fallback
  return addDays(start, planDays);
}

/* ============================================================
         ✅ 4) Status Decision Logic (Active / Soon / Grace / Expired)
         ============================================================ */

/**
 * ✅ getSubscriptionStatus(config)
 * Returns:
 * {
 *   status, uiType,
 *   endDate, effectiveEnd, graceEnd, finalValidUntil,
 *   daysLeft
 * }
 *
 * Business interpretation:
 * 🔹 endDate       → raw plan end (based on plan rule)
 * 🔹 effectiveEnd  → last valid day (depends on inclusiveEnd)
 * 🔹 graceEnd      → effectiveEnd + graceDays
 * 🔹 finalValidUntil → graceEnd if grace exists, else effectiveEnd
 *
 * Status rules:
 * 🔹 ACTIVE        → today <= effectiveEnd
 * 🔹 EXPIRING_SOON → ACTIVE but daysLeft <= soonThresholdDays
 * 🔹 IN_GRACE      → after effectiveEnd but still <= graceEnd
 * 🔹 EXPIRED       → after effectiveEnd and not in grace
 */

function getSubscriptionStatus({
  startDate,
  planValue,
  fixedDaysMode,
  inclusiveEnd,
  graceDays,
  soonThresholdDays,
  today,
}) {
  // 1️⃣ Compute plan end date (date-only)
  const endDate = stripTime(
    computeEndDate(startDate, planValue, fixedDaysMode),
  );

  // 2️⃣ Decide what counts as the "last valid day"
  // Inclusive ON  => end date counts as valid
  // Inclusive OFF => last valid day is endDate - 1
  const effectiveEnd = inclusiveEnd ? endDate : addDays(endDate, -1);

  // 3️⃣ Grace ends at (effectiveEnd + graceDays)
  const graceEnd = stripTime(addDays(effectiveEnd, graceDays));

  // 4️⃣ Normalize today for comparison
  const t = stripTime(today);

  // 5️⃣ Days left can be positive, 0, or negative
  const daysLeft = Math.floor((effectiveEnd - t) / msPerDay);

  // 6️⃣ Status checks
  const isActive = t <= effectiveEnd;
  const inGrace = !isActive && graceDays > 0 && t <= graceEnd;

  let status = "EXPIRED";
  let uiType = "bad";

  if (isActive) {
    if (daysLeft <= soonThresholdDays) {
      status = "EXPIRING_SOON";
      uiType = "warn";
    } else {
      status = "ACTIVE";
      uiType = "good";
    }
  } else if (inGrace) {
    status = "IN_GRACE";
    uiType = "warn";
  }

  const finalValidUntil = graceDays > 0 ? graceEnd : effectiveEnd;

  return {
    status,
    uiType,
    endDate,
    effectiveEnd,
    graceEnd: graceDays > 0 ? graceEnd : null,
    finalValidUntil,
    daysLeft,
  };
}

/* ============================================================
         ✅ 5) UI Action: Check Status Button
         ============================================================ */

function checkStatus() {
  const startVal = startDateInput.value;

  // ✅ Validate start date
  if (!startVal) {
    showMessage("bad", "❌ Please select a start date.");
    resetOutputs();
    return;
  }

  // ✅ Parse and normalize input values
  const startDate = stripTime(parseDateInput(startVal));
  const planValue = planInput.value;

  const graceDays = safeInt(graceDaysInput.value, 0);
  const soonDays = safeInt(soonDaysInput.value, 7);

  const inclusiveEnd = inclusiveEndInput.checked;
  const fixedDaysMode = fixedDaysModeInput.checked;

  const today = new Date();

  // ✅ Calculate business result
  const result = getSubscriptionStatus({
    startDate,
    planValue,
    fixedDaysMode,
    inclusiveEnd,
    graceDays,
    soonThresholdDays: soonDays,
    today,
  });

  // ✅ Update result UI
  outEnd.textContent = formatDate(result.endDate);
  outDaysLeft.textContent = result.daysLeft.toLocaleString();
  outGraceEnd.textContent = result.graceEnd ? formatDate(result.graceEnd) : "—";
  outFinalValid.textContent = formatDate(result.finalValidUntil);

  // ✅ Show badge + message based on status
  if (result.status === "ACTIVE") {
    setBadge("good", "Status: ACTIVE ✅");
    showMessage("good", "✅ Subscription is active.");
  } else if (result.status === "EXPIRING_SOON") {
    setBadge("warn", "Status: EXPIRING SOON ⚠️");
    showMessage(
      "warn",
      `⚠️ Subscription will expire soon (≤ ${soonDays} days left).`,
    );
  } else if (result.status === "IN_GRACE") {
    setBadge("warn", "Status: IN GRACE 🕒");
    showMessage(
      "warn",
      "🕒 Subscription expired, but user is still within grace period.",
    );
  } else {
    setBadge("bad", "Status: EXPIRED ❌");
    showMessage("bad", "❌ Subscription is expired.");
  }

  // ✅ Details line explains which business rules were used
  const planLabel = planInput.options[planInput.selectedIndex].text;
  const modeLabel = fixedDaysMode ? "Fixed-days" : "Calendar-based";
  const endRule = inclusiveEnd ? "Inclusive end date" : "Exclusive end date";

  detailsLine.textContent =
    `Details: Plan = ${planLabel} | Mode = ${modeLabel} | ` +
    `${endRule} | Grace = ${graceDays} day(s) | Soon threshold = ${soonDays} day(s)`;

  setStatus("Checked ✅");
}

/* ============================================================
         ✅ 6) Events (buttons + input changes)
         ============================================================ */

// Show today's date in the header chip
todayChip.textContent = `Today: ${formatDate(new Date())}`;

// Main button
btnCheck.addEventListener("click", checkStatus);

// Demo: start 20 days ago + useful defaults
btnDemo.addEventListener("click", () => {
  const t = new Date();
  t.setDate(t.getDate() - 20);

  // Convert to YYYY-MM-DD for the date input
  const yyyy = t.getFullYear();
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  startDateInput.value = `${yyyy}-${mm}-${dd}`;

  planInput.value = "30"; // monthly
  graceDaysInput.value = "5";
  soonDaysInput.value = "7";
  inclusiveEndInput.checked = true;
  fixedDaysModeInput.checked = true;

  setStatus("Ready…");
  showMessage("neutral", "📌 Demo values set. Click “Check Status”.");
});

// Clear: reset everything
btnClear.addEventListener("click", () => {
  startDateInput.value = "";
  planInput.value = "30";
  graceDaysInput.value = "0";
  soonDaysInput.value = "7";
  inclusiveEndInput.checked = true;
  fixedDaysModeInput.checked = true;

  resetOutputs();
  showMessage(
    "neutral",
    "Tip: Choose a start date, plan, then click “Check Status”.",
  );
});

// Bonus UX: change any input => show Ready…
[
  startDateInput,
  planInput,
  graceDaysInput,
  soonDaysInput,
  inclusiveEndInput,
  fixedDaysModeInput,
].forEach((el) => {
  el.addEventListener("change", () => {
    setStatus("Ready…");
  });
});

// Initial reset
resetOutputs();
