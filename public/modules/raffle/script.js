// public/modules/raffle/script.js
document.addEventListener('DOMContentLoaded', () => {
  const form  = document.getElementById('raffleForm');
  const toast = document.getElementById('toast');
  const userEl = document.getElementById('userId');
  const entriesEl = document.getElementById('entries');

  // 🔗 Client-provided Stripe Payment Link (LIVE)
  const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/8x200idP50Zy69Bh1n7Vm05';

  // Show a little toast
  function show(msg, ok = true) {
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = ok ? '#D1FAE5' : '#FEE2E2';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // Pre-fill userId if we have it
  const lastId = localStorage.getItem('raffle_last_userId');
  if (lastId && userEl) userEl.value = lastId;

  // If redirected back with ?canceled=1 → inform user
  const params = new URLSearchParams(location.search);
  if (params.has('canceled')) {
    show('Payment canceled. No tickets were added.', false);
  }

  // Show a toast if user returned from a canceled checkout
  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(location.search);
    if (params.get('canceled') === '1') {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = 'Payment canceled. No charges made.';
        toast.style.background = '#FEE2E2';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
      }
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const userId  = (userEl?.value || '').trim();
    const entries = Number(entriesEl?.value || 1);

    if (!userId || !Number.isFinite(entries) || entries < 1) {
      show('Please enter a valid userId and entries (>= 1).', false);
      return;
    }

    // Persist so the payment-success page can credit if webhook isn’t live yet
    localStorage.setItem('tk_pending_checkout', JSON.stringify({ userId, entries }));
    localStorage.setItem('raffle_last_userId', userId);
    sessionStorage.setItem('raffle_userId', userId);
    sessionStorage.setItem('raffle_entries', String(entries));

    show('Redirecting to Stripe Checkout…');

    // Open Stripe Checkout in a new tab
    window.open(STRIPE_PAYMENT_LINK, '_blank');
  });
});
