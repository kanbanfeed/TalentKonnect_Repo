// public/modules/qualification-gate/script.js
document.addEventListener('DOMContentLoaded', () => {
  const paidBtn  = document.getElementById("paidBtn");
  const freeBtn  = document.getElementById("freeBtn");
  const paidForm = document.getElementById("paidForm");
  const freeForm = document.getElementById("freeForm");
  const toast    = document.getElementById("toast");
  const tokenBox = document.getElementById("tokenBox");

  console.log('[QG] init', { paidBtn: !!paidBtn, freeBtn: !!freeBtn, paidForm: !!paidForm, freeForm: !!freeForm, toast: !!toast });

  // View switch
  if (paidBtn && freeBtn && paidForm && freeForm) {
    paidBtn.addEventListener("click", () => {
      paidForm.classList.remove("hidden");
      freeForm.classList.add("hidden");
    });
    freeBtn.addEventListener("click", () => {
      freeForm.classList.remove("hidden");
      paidForm.classList.add("hidden");
    });
  }

  // Toast
  function showToast(message, isError = false) {
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#EF4444" : "#10B981";
    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 3000);
  }

  // Show ticket helper (also saves to localStorage)
  function showTicket(result) {
    if (tokenBox) {
      tokenBox.innerHTML = `Ticket created — <strong class="token">${result.token}</strong> (tier: ${result.tier})`;
      tokenBox.classList.add("show");
    }
    localStorage.setItem("qualificationToken", result.token);
    localStorage.setItem("qualificationTier", result.tier);
  }

  // Restore saved ticket (if any)
  const savedToken = localStorage.getItem("qualificationToken");
  const savedTier  = localStorage.getItem("qualificationTier");
  if (savedToken && tokenBox) {
    tokenBox.innerHTML = `🔁 Existing ticket — <strong class="token">${savedToken}</strong> (tier: ${savedTier || "n/a"})`;
    tokenBox.classList.add("show");
  }

  // Dev vs Prod API base
  const API_BASE = location.hostname === "localhost" ? "http://localhost:3000" : "";

  // API
  async function submitQualification(data) {
    const resp = await fetch(`${API_BASE}/api/qualify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(json?.error || `HTTP ${resp.status}`);
    return json; // { message, token, tier }
  }

  // Paid form
  if (paidForm) {
    paidForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const skill    = document.getElementById("skill")?.value?.trim();
      const fun      = document.getElementById("fun")?.value?.trim();
      const feedback = document.getElementById("feedback")?.value?.trim();

      if (!skill || !fun || !feedback) {
        showToast("Please complete all quiz questions", true);
        return;
      }

      try {
        const result = await submitQualification({ path: "paid", skill, fun, feedback });
        showTicket(result);                           // <-- moved here
        showToast("Quiz submitted successfully");
        paidForm.reset();
      } catch (err) {
        console.error('[QG] submit (paid) error', err);
        showToast(err.message || "Submission failed", true);
      }
    });
  }

  // Free form
  if (freeForm) {
    freeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const required = Array.from(freeForm.querySelectorAll("input[required], textarea[required]"));
      if (!required.every(i => i.value.trim() !== "")) {
        showToast("Please complete all fields", true);
        return;
      }

      try {
        const formData = new FormData(freeForm);
        const data = { path: "free" };
        for (const [k, v] of formData.entries()) data[k] = v;

        const result = await submitQualification(data);
        showTicket(result);                           // <-- and here
        showToast("Form submitted successfully");
        freeForm.reset();
      } catch (err) {
        console.error('[QG] submit (free) error', err);
        showToast(err.message || "Submission failed", true);
      }
    });
  }
});

