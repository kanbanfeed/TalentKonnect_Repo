// public/modules/qualification-gate/script.js
document.addEventListener('DOMContentLoaded', () => {
  const paidBtn  = document.getElementById("paidBtn");
  const freeBtn  = document.getElementById("freeBtn");
  const paidForm = document.getElementById("paidForm");
  const freeForm = document.getElementById("freeForm");
  const toast    = document.getElementById("toast");
  const tokenBox = document.getElementById("tokenBox");

  console.log('[QG] init', {
    paidBtn: !!paidBtn, freeBtn: !!freeBtn, paidForm: !!paidForm, freeForm: !!freeForm, toast: !!toast
  });

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

  // Token box updater
  function updateTokenBox(token, tier) {
    const box = document.getElementById('tokenBox');
    if (!box) return;
    box.innerHTML = `🔁 Existing ticket — <strong class="token">${token}</strong> (tier: ${tier || 'n/a'})`;
    box.classList.add('show'); // ensure your CSS makes .show visible
  }

  // “Show ticket” + persist
  function showTicket(result) {
    if (!result) return;
    localStorage.setItem("qualificationToken", result.token);
    localStorage.setItem("qualificationTier", result.tier);
    updateTokenBox(result.token, result.tier);
  }

  // Restore saved ticket (if any)
  {
    const savedToken = localStorage.getItem("qualificationToken");
    const savedTier  = localStorage.getItem("qualificationTier");
    if (savedToken) updateTokenBox(savedToken, savedTier);
  }

  // Dev vs Prod API base
  const API_BASE='https://talentkonnect-liard.vercel.app'

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
        showToast("Quiz submitted successfully");
        showTicket(result);          // save + show token
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
        showToast("Form submitted successfully");
        showTicket(result);          // save + show token
        freeForm.reset();
      } catch (err) {
        console.error('[QG] submit (free) error', err);
        showToast(err.message || "Submission failed", true);
      }
    });
  }
});
