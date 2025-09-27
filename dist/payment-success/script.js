// const SITE_URL = location.hostname === 'localhost' ? 'http://localhost:3000' : '';
// (async function () {
//   const userId  = sessionStorage.getItem('raffle_userId') || JSON.parse(localStorage.getItem('tk_pending_checkout')||'{}').userId || 'demo-user-1';
//   const entries = Number(sessionStorage.getItem('raffle_entries') || JSON.parse(localStorage.getItem('tk_pending_checkout')||'{}').entries || 1);

//   try {
//     const r = await fetch(`${SITE_URL}/api/raffle/credit`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ userId, entries })
//     });
//     const data = await r.json();
//     document.getElementById('confirm').textContent =
//       `✅ Payment received — ${entries} raffle entries added to ${userId}. Total now: ${data.totalTickets}.`;
//     // optional clean-up:
//     localStorage.removeItem('tk_pending_checkout');
//   } catch (e) {
//     document.getElementById('confirm').textContent = '⚠️ Payment captured, but failed to credit entries.';
//   }
// })();
