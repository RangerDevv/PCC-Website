'use strict';

const Stripe = require('stripe');

const REGISTRATION_FEE_CENTS = parseInt(process.env.REGISTRATION_FEE_CENTS, 10) || 1500;
const CURRENCY = 'usd';

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'https://pittsburghcharitycup.org')
  .split(',')
  .map((o) => o.trim());

module.exports = async (req, res) => {
  // CORS headers
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration: missing Stripe key.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-04-22.dahlia',
  });

  try {
    const { name, email, phone } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    if (typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    let customer;
    const existing = await stripe.customers.list({ email: email.trim(), limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({
        name:  name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        metadata: { source: 'pittsburgh_charity_cup_2026' },
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   REGISTRATION_FEE_CENTS,
      currency: CURRENCY,
      customer: customer.id,
      description: 'Pittsburgh Charity Cup 2026 — Registration Fee',
      receipt_email: email.trim(),
      metadata: {
        player_name:  name.trim(),
        player_email: email.trim(),
        player_phone: phone.trim(),
        tournament:   'Pittsburgh Charity Cup 2026',
      },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('[create-payment-intent]', err.type, err.message);
    const statusCode = err.statusCode || (err.type === 'StripeInvalidRequestError' ? 400 : 500);
    res.status(statusCode).json({
      error: err.message || 'Payment initialisation failed. Please try again.',
    });
  }
};
