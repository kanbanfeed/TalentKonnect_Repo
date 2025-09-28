document.addEventListener('DOMContentLoaded', () => {
  const form  = document.getElementById('raffleForm');
  const toast = document.getElementById('toast');
  const userEl = document.getElementById('userId');
  const entriesEl = document.getElementById('entries');
  const ticketCountEl = document.getElementById('ticketCount');

  // 🔗 Stripe Test Payment Link (can be replaced with LIVE later)
  const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/8x200idP50Zy69Bh1n7Vm05';

  function show(msg, ok = true) {
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = ok ? '#D1FAE5' : '#FEE2E2';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // Pre-fill userId if stored
  const lastId = localStorage.getItem('raffle_last_userId');
  if (lastId && userEl) userEl.value = lastId;

  // Handle query params for success/cancel
  const params = new URLSearchParams(location.search);
  if (params.get('canceled') === '1') show('Payment canceled. No tickets were added.', false);
  if (params.get('success') === '1') show('Payment successful! Tickets updated.');

  // Refresh ticket count from API
  async function refreshTickets() {
    try {
      let uid = sessionStorage.getItem('raffle_userId') || localStorage.getItem('raffle_last_userId') || '';
      uid = uid.trim();
      if (!uid) return;
      const res = await fetch(`${window.location.origin}/api/raffle/tickets/${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = await res.json();
        if(ticketCountEl) ticketCountEl.textContent = data.tickets || 0;
      }
    } catch (e) {
      console.warn('[refreshTickets]', e);
    }
  }

  // Initial refresh
  refreshTickets();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const userId  = (userEl?.value || '').trim();
    const entries = Number(entriesEl?.value || 1);

    if (!userId || !Number.isFinite(entries) || entries < 1) {
      show('Please enter a valid userId and entries (>= 1).', false);
      return;
    }

    // Persist info so success page can credit tickets
    localStorage.setItem('tk_pending_checkout', JSON.stringify({ userId, entries }));
    localStorage.setItem('raffle_last_userId', userId);
    sessionStorage.setItem('raffle_userId', userId);
    sessionStorage.setItem('raffle_entries', String(entries));

    show('Redirecting to Stripe Checkout…');

    // Open Stripe Checkout in a new tab
    window.open(STRIPE_PAYMENT_LINK, '_blank');
  });

  // Refresh tickets if storage changes (other tab updates)
  window.addEventListener('storage', (e) => {
    if(e.key==='tk_pending_checkout' || e.key==='raffle_entries') refreshTickets();
  });
});
