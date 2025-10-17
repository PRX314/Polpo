const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  async createProduct(productData) {
    try {
      const stripeProduct = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        images: productData.images?.map(img => img.url).filter(Boolean) || [],
        metadata: {
          category: productData.category,
          productId: productData._id.toString()
        }
      });

      return stripeProduct;
    } catch (error) {
      console.error('Error creating Stripe product:', error);
      throw error;
    }
  }

  async createPrice(productId, amount, currency = 'eur') {
    try {
      const price = await stripe.prices.create({
        unit_amount: Math.round(amount * 100),
        currency,
        product: productId
      });

      return price;
    } catch (error) {
      console.error('Error creating Stripe price:', error);
      throw error;
    }
  }

  async updateProduct(stripeProductId, productData) {
    try {
      const updatedProduct = await stripe.products.update(stripeProductId, {
        name: productData.name,
        description: productData.description,
        images: productData.images?.map(img => img.url).filter(Boolean) || [],
        metadata: {
          category: productData.category,
          productId: productData._id.toString()
        }
      });

      return updatedProduct;
    } catch (error) {
      console.error('Error updating Stripe product:', error);
      throw error;
    }
  }

  async createPaymentIntent(amount, currency = 'eur', metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async createCheckoutSession(lineItems, successUrl, cancelUrl, metadata = {}) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw error;
    }
  }

  async refundPayment(paymentIntentId, amount = null) {
    try {
      const refundData = { payment_intent: paymentIntentId };
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await stripe.refunds.create(refundData);
      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  constructEvent(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('Error constructing webhook event:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();