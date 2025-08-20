document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('raffleForm');
  const toast = document.getElementById('toast');

  // dev/prod base (UI 517x → API 3000 in dev)
  const API_BASE = location.hostname === 'localhost' ? 'https://talentkonnect-liard.vercel.app' : '';

  function show(msg, ok=true){
    toast.textContent = msg;
    toast.style.background = ok ? '#D1FAE5' : '#FEE2E2';
    toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), 2500);
  }

 form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userId = document.getElementById('userId').value.trim();
  const entries = Number(document.getElementById('entries').value || 1);

  if (!userId || !entries || entries < 1) {
    show('Please enter a valid userId and entries', false);
    return;
  }

  const popup = window.open();
  if (!popup) {
    show('Popup blocked. Please allow pop-ups for this site.', false);
    return;
  }
  popup.document.write('<p style="font-family:Inter,system-ui">Opening Stripe Checkout…</p>');

  try {
    const res = await fetch(`${API_BASE}/api/payments/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, entries })
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[checkout] HTTP error', res.status, txt);
      popup.close();
      show(`Checkout error (${res.status})`, false);
      return;
    }

    const data = await res.json().catch(() => ({}));
   if (data && data.url) {
  console.log('[checkout] got url', data.url);
  // tell the parent shell to navigate (top-level), no popup needed
  window.parent?.postMessage(
    { type: 'TK_CHECKOUT_REDIRECT', url: data.url },
    window.location.origin // same-origin message
  );
  show('Opening Stripe Checkout…');
  return;
} else {
  show('API returned no checkout URL', false);
}
  } catch (err) {
    console.error('[checkout] fetch error', err);
    popup.close();
    show('Network error calling checkout', false);
  }
});

});
// v2 — child only asks parent to start checkout; no popups, no fetch here.
document.addEventListener('DOMContentLoaded', () => {
  console.log('[raffle] v2 script loaded');
  const form = document.getElementById('raffleForm');
  const toast = document.getElementById('toast');

  function show(msg, ok = true) {
    toast.textContent = msg;
    toast.style.background = ok ? '#D1FAE5' : '#FEE2E2';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = document.getElementById('userId').value.trim();
    const entries = Number(document.getElementById('entries').value || 1);
    if (!userId || !entries || entries < 1) {
      show('Please enter a valid userId and entries', false);
      return;
    }
    console.log('[raffle] sending TK_CHECKOUT_REQUEST', { userId, entries });
    // Let the shell (parent) handle API + redirect (top-level)
    window.parent?.postMessage(
      { type: 'TK_CHECKOUT_REQUEST', payload: { userId, entries } },
      '*' // permissive for local dev
    );
    show('Starting checkout…');
  });
});

localStorage.setItem('raffle_userId', userId);
sessionStorage.setItem('raffle_userId', userId);

