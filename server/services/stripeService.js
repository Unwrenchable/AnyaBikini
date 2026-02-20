// Stripe service: handles Stripe integration
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

function isStripeConfigured() {
  return !!stripe;
}

async function createCheckoutSession({ items, success_url, cancel_url, payment_method_types }) {
  if (!stripe) throw new Error('Stripe not configured');
  const line_items = items.map(i => ({
    price_data: {
      currency: 'usd',
      product_data: { name: i.name },
      unit_amount: Math.round((i.price || 0) * 100)
    },
    quantity: i.quantity || 1
  }));
  const session = await stripe.checkout.sessions.create({
    payment_method_types: payment_method_types || ['card'],
    mode: 'payment',
    line_items,
    success_url,
    cancel_url
  });
  return session.url;
}

async function createPaymentIntent({ items, currency }) {
  if (!stripe) throw new Error('Stripe not configured');
  const amount = items.reduce((s, i) => s + Math.round((i.price || 0) * 100) * (i.quantity || 1), 0);
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: currency || 'usd',
    automatic_payment_methods: { enabled: true }
  });
  return paymentIntent.client_secret;
}

module.exports = {
  isStripeConfigured,
  createCheckoutSession,
  createPaymentIntent,
};
