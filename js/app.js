/* Age Calculator — exact age in years/months/days + next-birthday countdown. */
"use strict";

/* ---------- Pure logic (testable in node) ---------- */
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Parse "YYYY-MM-DD" as a local date (no timezone shift).
function parseDate(value) {
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const y = Number(parts[0]), m = Number(parts[1]) - 1, d = Number(parts[2]);
  const date = new Date(y, m, d);
  if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null;
  return date;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function calculateAge(birth, ref) {
  const b = startOfDay(birth);
  const r = startOfDay(ref);
  let years = r.getFullYear() - b.getFullYear();
  let months = r.getMonth() - b.getMonth();
  let days = r.getDate() - b.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(r.getFullYear(), r.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalDays = Math.floor((r - b) / 86400000);
  return { years, months, days, totalDays };
}

function nextBirthday(birth, ref) {
  const r = startOfDay(ref);
  let year = r.getFullYear();
  let candidate = new Date(year, birth.getMonth(), birth.getDate());
  // Feb 29 birthdays land on Mar 1 in non-leap years (same convention
  // calculateAge uses when it borrows February's days).
  if (birth.getMonth() === 1 && birth.getDate() === 29 && candidate.getMonth() !== 1) {
    candidate = new Date(year, 2, 1);
  }
  if (candidate < r) {
    year += 1;
    candidate = new Date(year, birth.getMonth(), birth.getDate());
    if (birth.getMonth() === 1 && birth.getDate() === 29 && candidate.getMonth() !== 1) {
      candidate = new Date(year, 2, 1);
    }
  }
  const daysUntil = Math.round((candidate - r) / 86400000);
  return { date: candidate, daysUntil };
}

function formatLongDate(date) {
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* DOM BOOTSTRAP */
if (typeof document !== "undefined") {
  const $ = (id) => document.getElementById(id);
  const birthInput = $("birthdate");
  const errorNote = $("error-note");
  const results = $("results");

  birthInput.max = new Date().toISOString().slice(0, 10);

  function showError(message) {
    errorNote.textContent = message;
    errorNote.classList.remove("hidden");
    results.classList.add("hidden");
  }

  function calculate() {
    const value = birthInput.value;
    if (!value) { showError("Pick your date of birth first — the calendar above is waiting."); return; }
    const birth = parseDate(value);
    if (!birth) { showError("That date doesn't look valid. Pick a real date from the calendar."); return; }
    const today = startOfDay(new Date());
    if (birth > today) { showError("That date is in the future — even time travellers need a birthdate in the past."); return; }

    errorNote.classList.add("hidden");
    const age = calculateAge(birth, today);
    const next = nextBirthday(birth, today);
    const totalMonths = age.years * 12 + age.months;
    const totalWeeks = Math.floor(age.totalDays / 7);

    $("age-years").textContent = age.years;
    $("age-months").textContent = age.months;
    $("age-days").textContent = age.days;
    $("total-days").textContent = age.totalDays.toLocaleString("en-GB");
    $("total-weeks").textContent = totalWeeks.toLocaleString("en-GB");
    $("total-months").textContent = totalMonths.toLocaleString("en-GB");
    $("born-weekday").textContent = formatLongDate(birth);
    $("next-birthday-date").textContent = formatLongDate(next.date);
    if (next.daysUntil === 0) {
      $("countdown").textContent = "🎉 It's today!";
      $("countdown-sub").textContent = "Happy birthday — " + age.years + " years old today.";
    } else {
      $("countdown").textContent = next.daysUntil + (next.daysUntil === 1 ? " day" : " days");
      $("countdown-sub").textContent = "Your " + (age.years + 1) + getOrdinalSuffix(age.years + 1) +
        " birthday is " + formatLongDate(next.date) + ".";
    }
    results.classList.remove("hidden");
  }

  function getOrdinalSuffix(n) {
    if (n % 100 >= 11 && n % 100 <= 13) return "th";
    if (n % 10 === 1) return "st";
    if (n % 10 === 2) return "nd";
    if (n % 10 === 3) return "rd";
    return "th";
  }

  $("calculate-btn").addEventListener("click", calculate);
  birthInput.addEventListener("change", calculate);
  birthInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); calculate(); } });
  $("clear-btn").addEventListener("click", () => {
    birthInput.value = "";
    results.classList.add("hidden");
    errorNote.classList.add("hidden");
    birthInput.focus();
  });

  initChrome();
}

function initChrome() {
  const header = document.getElementById("site-header");
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("mobile-menu");
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => menu.classList.remove("open")));
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}
