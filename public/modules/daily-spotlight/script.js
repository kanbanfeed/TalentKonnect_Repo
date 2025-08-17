// === Daily Spotlight — browser script (no modules) ===

// Mock data for the manual "Run Selection" demo
var mockSubmissions = [
  {
    id: 1,
    title: "Advanced React Performance Optimization Techniques",
    author: "Alex Kumar",
    score: 847,
    submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    preview:
      "Comprehensive guide covering memo, useMemo, useCallback, code splitting, and bundle optimization strategies for React applications...",
  },
  {
    id: 2,
    title: "Machine Learning Model Deployment with Docker",
    author: "Sarah Chen",
    score: 723,
    submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    preview:
      "Step-by-step tutorial on containerizing ML models for production deployment with best practices and monitoring...",
  },
  {
    id: 3,
    title: "CSS Grid Advanced Layout Patterns",
    author: "Mike Rodriguez",
    score: 692,
    submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    preview:
      "Exploring complex grid layouts, subgrid properties, and responsive design patterns using modern CSS Grid...",
  },
];

var currentBracketCount = 47;
var currentWinner = mockSubmissions[0];

// Use Vercel API in dev, relative path in prod
var API_BASE = location.hostname === "localhost" ? "http://localhost:3000" : "";

// ---- API loader (fills currentWinner + next selection time) ----
async function loadWinnerFromApi() {
  try {
    var r = await fetch(API_BASE + "/api/spotlight/current");
    if (!r.ok) throw new Error("HTTP " + r.status);
    var data = await r.json();
    var w = data.winner || {};

    // Adapt API shape → UI shape used by this page
    currentWinner = {
      id: w.id || 0,
      title: w.title || "",
      author: w.name || "",
      score: w.points || 0,
      submittedAt: new Date(), // placeholder timestamp
      preview: "—",
    };

    // stash for "Next selection" label
    window.__nextSelectionUTC = data.nextSelectionUTC;
  } catch (err) {
    console.error("[Spotlight API] error", err);
    // keep the mock currentWinner if API fails
  }
}

// ---- Deterministic selection over last 24h (demo/manual) ----
function selectDailySpotlight() {
  var now = new Date();
  var twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  var recentSubmissions = mockSubmissions.filter(function (sub) {
    return sub.submittedAt >= twentyFourHoursAgo;
  });

  if (recentSubmissions.length === 0) return null;

  recentSubmissions.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score; // higher score wins
    return a.submittedAt - b.submittedAt; // earlier time wins (deterministic)
  });

  return recentSubmissions[0];
}

// ---- Email "service" (demo logger) ----
function sendSpotlightNotification(winner) {
  return new Promise(function (resolve) {
    var emailData = {
      to: winner.author.toLowerCase().replace(" ", ".") + "@example.com",
      subject: "🏆 You're Today's Daily Spotlight Winner!",
      template: "spotlight_winner",
      data: {
        winnerName: winner.author,
        submissionTitle: winner.title,
        score: winner.score,
        credits: 100,
        date: new Date().toLocaleDateString(),
        spotlightUrl: "https://platform.com/spotlight/" + winner.id,
      },
    };
    setTimeout(function () {
      console.log("[MAIL] simulated send:", emailData);
      resolve({ success: true, messageId: "msg_" + Date.now() });
    }, 600);
  });
}

// ---- Cron simulation (client-side demo) ----
function scheduledSpotlightSelection() {
  var winner = selectDailySpotlight();
  if (winner) {
    updateSpotlightUI(winner);
    sendSpotlightNotification(winner);
    incrementBracketCounter();
    console.log(
      "Daily Spotlight selected:",
      winner.title,
      "by",
      winner.author,
      "(Score:",
      winner.score + ")"
    );
  }
}

// ---- UI helpers ----
function updateSpotlightUI(winner) {
  var initials = winner.author
    .split(" ")
    .map(function (n) {
      return n[0];
    })
    .join("");
  setText("winner-avatar", initials || "—");
  setText("winner-name", winner.author || "—");
  setText("winner-time", getRelativeTime(winner.submittedAt));
  setHTML("submission-title", winner.title ? '"' + winner.title + '"' : "—");
  setText("submission-score", String(winner.score || "—"));
  setText("submission-date", winner.submittedAt.toLocaleDateString());
  setText(
    "submission-time",
    winner.submittedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
  setText("submission-preview", winner.preview || "—");

  // also fill the email template placeholders
  setText("email-winner-name", winner.author || "—");
  setText("email-submission-title", winner.title || "—");
  setText("email-score", String(winner.score || "—"));
}

function incrementBracketCounter() {
  currentBracketCount++;
  setText("bracket-counter", String(currentBracketCount));
  var progressPercentage = Math.min((currentBracketCount / 100) * 100, 100);
  var fill = document.getElementById("progress-fill");
  if (fill) fill.style.width = progressPercentage + "%";
}

function getRelativeTime(date) {
  var now = new Date();
  var diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  if (diffInHours < 1) return "Just now";
  if (diffInHours === 1) return "1 hour ago";
  return diffInHours + " hours ago";
}

function showToast(message, type) {
  type = type || "success";
  var toast = document.getElementById("toast");
  if (!toast) return;
  toast.querySelector("div:first-child").textContent = type === "success" ? "Success!" : "Action completed";
  toast.querySelector("div:last-child").textContent = message;
  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
  }, 3000);
}

// ---- Buttons (global for inline onclick=) ----
async function runSpotlightSelection() {
  try {
    const res = await fetch(`${API_BASE}/api/spotlight/run`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await reloadSpotlightFromApi();           // refresh UI from server result
    showToast('Spotlight selection completed successfully');
  } catch (err) {
    console.error('[spotlight] run error', err);
    showToast('Failed to run selection', 'error');
  }
}

// Refresh the winner card + “next selection” + email template from API
async function reloadSpotlightFromApi() {
  const r = await fetch(`${API_BASE}/api/spotlight/current`);
  const data = await r.json();
  const w = data?.winner || {};

  // adapt API winner to your UI shape
  const winner = {
    id: w.id || '',
    author: w.name || '',
    title: w.title || '',
    score: w.points || 0,
    submittedAt: new Date(),   // placeholder
    preview: '—'
  };

  updateSpotlightUI(winner);
  updateEmailTemplate(w);      // update template fields

  // next selection (IST)
  const next = data?.nextSelectionUTC;
  if (next) {
    const ist = new Date(next).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
    const el = document.getElementById('next-selection');
    if (el) el.textContent = `${ist} IST`;
  }
}

// Fill the email template preview
function updateEmailTemplate(winner) {
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('email-winner-name', winner?.name || '—');
  setText('email-submission-title', winner?.title || '—');
  setText('email-score', String(winner?.points ?? '—'));
}


function sendTestEmail() {
  const url = API_BASE + '/api/spotlight/email'; // ✅ singular
  console.log('[email] POST', url);
  fetch(url, { method: 'POST' })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(data => {
      console.log('[email] sent', data);
      showToast('Email notification queued for current winner');
    })
    .catch(err => {
      console.error('[email] error', err);
      showToast('Failed to send email', 'error');
    });
}


function viewAnalytics() {
  showToast("Analytics view would open here");
}

// ---- Next selection label ----
function updateNextSelectionTime() {
  // fallback calculation (used if API not available)
  var now = new Date();
  var tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0); // 10:00 IST
  var timeUntil = +tomorrow - +now;
  var hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
  var txt =
    hoursUntil < 24
      ? "In " + hoursUntil + " hours (Tomorrow at 10:00 IST)"
      : "Tomorrow at 10:00 IST";
  setHTML("next-selection", txt);
}

function updateNextSelectionTimeFromApi() {
  var el = document.getElementById("next-selection");
  var next = window.__nextSelectionUTC;
  if (!el || !next) {
    updateNextSelectionTime();
    return;
  }
  var ist = new Date(next).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  el.textContent = ist + " IST";
}

// ---- Init ----
async function initializeDashboard() {
  console.log("[DailySpotlight] init");
  await loadWinnerFromApi();
  updateSpotlightUI(currentWinner);
  updateNextSelectionTimeFromApi();
  setInterval(updateNextSelectionTimeFromApi, 60000);

  // demo "cron" if you load the page right at 10:00 IST
  var now = new Date();
  if (now.getHours() === 10 && now.getMinutes() === 0) {
    scheduledSpotlightSelection();
  }
}

// keyboard a11y: ESC hides toast
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    var t = document.getElementById("toast");
    if (t) t.classList.remove("show");
  }
});

// start once DOM is ready
document.addEventListener("DOMContentLoaded", initializeDashboard);

// Exports for Node context (if ever required)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    selectDailySpotlight: selectDailySpotlight,
    sendSpotlightNotification: sendSpotlightNotification,
    scheduledSpotlightSelection: scheduledSpotlightSelection,
  };
}

// small DOM helpers
function setText(id, v) {
  var el = document.getElementById(id);
  if (el) el.textContent = v;
}
function setHTML(id, v) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = v;
}
