const Stripe = require("stripe");
const crypto = require("crypto");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Magic Link generieren
function generateMagicLink() {
  return crypto.randomBytes(32).toString("hex");
}

// Email versenden (TODO: Email-Service integrieren)
async function sendMagicLinkEmail(email, magicLink) {
  const magicLinkUrl = `${process.env.SITE_URL}/verify-magic-link.html?token=${magicLink}&email=${encodeURIComponent(email)}`;
  
  console.log(`🔑 Magic Link für ${email}:`);
  console.log(magicLinkUrl);
  
  // Beispiel mit SendGrid (später aktivieren):
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: email,
  //   from: process.env.FROM_EMAIL,
  //   subject: "🎯 Dein Amana Club Premium Access",
  //   html: `<h2>Willkommen im Premium Club!</h2><a href="${magicLinkUrl}"><button>Premium Zugang aktivieren</button></a>`
  // });
}

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

      // Magic Link generieren
      const magicLink = generateMagicLink();

      // Email versenden
      await sendMagicLinkEmail(customerEmail, magicLink);

      console.log(`✅ Abo aktiviert für: ${customerEmail}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (err) {
    console.error("❌ Webhook Error:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message })
    };
  }
};
