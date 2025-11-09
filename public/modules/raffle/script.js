document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("paymentForm");
  const toast = document.getElementById("toast");
  const emailEl = document.getElementById("email");
  const entriesEl = document.getElementById("entries");

  // ✅ Crowbar backend endpoints
  const CROWBAR_BASE = "https://api.crowbarltd.com/api/stripe";
  const BRIDGE_TOKEN =
    "KCiwGXQETMGsSX6z6XdhrYnU0Jx3RU2AKAL3RHYbFFw2lFYaPDZHylI0GVwqlmewaeqTNpyGWj5mBxE3voMqszztBrdznDOyp6DR";

  function show(msg, ok = true) {
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = ok ? "#D1FAE5" : "#FEE2E2";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailEl?.value.trim();
    const entries = Number(entriesEl?.value || 1);

    if (!email || !Number.isFinite(entries) || entries < 1) {
      show("Please enter a valid email and number of credits (>= 1).", false);
      return;
    }

    show("Initializing checkout…");

    try {
      // Step 1️⃣ — Sync user in Crowbar
      const syncRes = await fetch(`${CROWBAR_BASE}/sync-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bridge-Token": BRIDGE_TOKEN,
        },
        body: JSON.stringify({
          email,
          product_type: "talentkonnect",
          quantity: entries,
        }),
      });

      if (!syncRes.ok) {
        const err = await syncRes.text();
        console.error("Sync-user failed:", err);
        show("Failed to sync user with Crowbar.", false);
        return;
      }

      // Step 2️⃣ — Create Stripe checkout session
      const res = await fetch(`${CROWBAR_BASE}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bridge-Token": BRIDGE_TOKEN,
        },
        body: JSON.stringify({
          email,
          product_type: "talentkonnect",
          quantity: entries,
        }),
      });

      const data = await res.json();
      console.log("Crowbar response:", data);

      // ✅ Crowbar returns { success: true, sessionId: "...", url: "..." }
      if (data?.url) {
        show("Redirecting to Stripe Checkout…");
        window.open(data.url, "_blank");
      } else {
        console.error("Unexpected response:", data);
        show("Failed to start checkout.", false);
      }
    } catch (err) {
      console.error("Payment init error:", err);
      show("Error connecting to payment server.", false);
    }
  });
});
