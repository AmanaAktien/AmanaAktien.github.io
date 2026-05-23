const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {

    const sig = event.headers["stripe-signature"];

    const stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (stripeEvent.type === "checkout.session.completed") {

      const session = stripeEvent.data.object;

      const customerEmail = session.customer_details.email;

      console.log("Neue Zahlung:");
      console.log(customerEmail);

    }

    return {
      statusCode: 200,
      body: "Webhook received"
    };

  } catch (err) {

    console.error(err);

    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`
    };
  }
};
