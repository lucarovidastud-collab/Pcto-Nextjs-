import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { logger } from "@/lib/logger";
import { planFromStripePrice, stripe, syncStripeSubscription } from "@/lib/services/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret || !stripe) {
    return NextResponse.json({ error: "Stripe webhook non configurato" }, { status: 500 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    logger.error({ error }, "stripe.webhook.invalid_signature");
    return NextResponse.json({ error: "Firma webhook non valida" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenantId || "";
      const plan = session.metadata?.plan || "starter";
      if (tenantId) {
        await syncStripeSubscription({
          tenantId,
          plan,
          status: "active",
          stripeCustomerId: String(session.customer || ""),
          stripeSubscriptionId: String(session.subscription || "")
        });
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenantId || "";
      const priceId = subscription.items.data[0]?.price?.id;
      if (tenantId) {
        await syncStripeSubscription({
          tenantId,
          plan: await planFromStripePrice(priceId),
          status: subscription.status,
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenantId || "";
      if (tenantId) {
        await syncStripeSubscription({
          tenantId,
          plan: "none",
          status: "canceled",
          stripeSubscriptionId: subscription.id
        });
      }
    }

    logger.info({ type: event.type }, "stripe.webhook.verified");
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error, type: event.type }, "stripe.webhook.handler_failed");
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
