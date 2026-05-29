'use strict';

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const Stripe     = require('stripe');

// ── Validate required environment variables ──────────────────────────────────
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('[ERROR] STRIPE_SECRET_KEY is not set. Check your .env file.');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia',
});

const app  = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// ── Registration fee (cents) — controlled server-side; never trust the client ─
const REGISTRATION_FEE_CENTS = parseInt(process.env.REGISTRATION_FEE_CENTS, 10) || 1500;
const CURRENCY = 'usd';

// ── Middleware ────────────────────────────────────────────────────────────────

// CORS — restrict to your own origin in production
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (same-origin, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS: ' + origin));
      }
    },
  })
);

// Parse JSON bodies (limit to 16 kb to guard against large-payload attacks)
app.use(express.json({ limit: '16kb' }));

// Serve all static files (HTML, CSS, JS) from the project root
app.use(express.static(path.join(__dirname)));

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/create-payment-intent
 *
 * Creates a Stripe PaymentIntent for the fixed registration fee.
 * The amount is set server-side — clients cannot change it.
 *
 * Body (JSON): { name: string, email: string, phone: string }
 * Response:    { clientSecret: string }
 */
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // ── Input validation ─────────────────────────────────────────────────────
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    if (typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    // ── Create or retrieve a Stripe Customer ────────────────────────────────
    // Reuse an existing customer if the email already exists, otherwise create one.
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

    // ── Create the PaymentIntent ─────────────────────────────────────────────
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
    console.error('[/api/create-payment-intent]', err.type, err.message);
    const statusCode = err.statusCode || (err.type === 'StripeInvalidRequestError' ? 400 : 500);
    res.status(statusCode).json({
      error: err.message || 'Payment initialisation failed. Please try again.',
    });
  }
});

/**
 * POST /api/create-donation-intent
 *
 * Creates a Stripe PaymentIntent for a variable donation amount.
 * Amount bounds are enforced server-side ($1–$10,000).
 *
 * Body (JSON): { name: string, email: string, amount: number (dollars), message?: string }
 * Response:    { clientSecret: string }
 */
app.post('/api/create-donation-intent', async (req, res) => {
  try {
    const { name, email, amount, message } = req.body;

    // ── Input validation ─────────────────────────────────────────────────────
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }

    // Convert dollars to cents and clamp to allowed range ($1–$10,000)
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 100 || amountCents > 1000000) {
      return res.status(400).json({ error: 'Donation amount must be between $1 and $10,000.' });
    }

    // ── Create or retrieve a Stripe Customer ────────────────────────────────
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

    // ── Create the PaymentIntent ─────────────────────────────────────────────
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
    console.error('[/api/create-donation-intent]', err.type, err.message);
    const statusCode = err.statusCode || (err.type === 'StripeInvalidRequestError' ? 400 : 500);
    res.status(statusCode).json({
      error: err.message || 'Payment initialisation failed. Please try again.',
    });
  }
});

// ── Catch-all: serve index.html for any unmatched route (SPA-style) ──────────
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n Pittsburgh Charity Cup — server running`);
  console.log(` http://localhost:${PORT}\n`);
});
