'use strict';

const Stripe = require('stripe');

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
    const { name, email, amount, message } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }

    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 100 || amountCents > 1000000) {
      return res.status(400).json({ error: 'Donation amount must be between $1 and $10,000.' });
    }

    let customer;
    const existing = await stripe.customers.list({ email: email.trim(), limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({
        name:  name.trim(),
        email: email.trim(),
        metadata: { source: 'pittsburgh_charity_cup_2026' },
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: CURRENCY,
      customer: customer.id,
      description: 'Pittsburgh Charity Cup 2026 — Donation',
      receipt_email: email.trim(),
      metadata: {
        donor_name:  name.trim(),
        donor_email: email.trim(),
        message:     typeof message === 'string' ? message.slice(0, 500) : '',
        tournament:  'Pittsburgh Charity Cup 2026',
      },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('[create-donation-intent]', err.type, err.message);
    const statusCode = err.statusCode || (err.type === 'StripeInvalidRequestError' ? 400 : 500);
    res.status(statusCode).json({
      error: err.message || 'Donation initialisation failed. Please try again.',
    });
  }
};
