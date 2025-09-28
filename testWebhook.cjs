// testWebhook.cjs — Test Stripe webhook and check ticket increment
const fetch = require('node-fetch'); // Node 18+ has global fetch
const API_BASE = 'https://www.talentkonnect.com'; // Use your deployed production domain

(async () => {
  try {
    const testUserId = 'testuser_prod';

    // 1️⃣ Create a fake checkout.session.completed payload (test mode)
    const payload = {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_session',
          object: 'checkout.session',
          amount_total: 1400, // 2 entries * 700 cents
          currency: 'usd',
          metadata: { userId: testUserId, entriesPurchased: '2' },
        },
      },
    };

    // 2️⃣ Send webhook to your production endpoint
    const webhookRes = await fetch(`${API_BASE}/api/stripe/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const webhookData = await webhookRes.json();
    console.log('Webhook API response:', webhookData);

    // 3️⃣ Fetch updated ticket count
    const ticketRes = await fetch(`${API_BASE}/api/raffle/tickets/${encodeURIComponent(testUserId)}`);
    const ticketData = await ticketRes.json();
    console.log(`Updated ticket count for ${testUserId}:`, ticketData.tickets);
  } catch (err) {
    console.error('Error testing webhook:', err);
  }
})();
