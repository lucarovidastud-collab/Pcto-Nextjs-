import { planCatalog, type PlanName } from "@/lib/billing/plans";
import type Stripe from "stripe";

/** Colori allineati a `app/globals.css` (tema chiaro). */
export const stripeCheckoutBranding = {
  displayName: "QuoteGen",
  backgroundColor: "#faf9f6",
  buttonColor: "#0d9488",
  borderStyle: "rounded" as const,
  fontFamily: "inter" as const
};

const planCopy: Record<
  PlanName,
  { productName: string; description: string; submitHint: string }
> = {
  starter: {
    productName: "QuoteGen Starter",
    description: "40 proposte AI al mese · fino a 3 membri · link cliente e PDF.",
    submitHint: "Attivando Starter accetti il rinnovo mensile su QuoteGen."
  },
  growth: {
    productName: "QuoteGen Growth",
    description: "300 proposte AI al mese · brand avanzato · portale fatturazione.",
    submitHint: "Attivando Growth accetti il rinnovo mensile su QuoteGen."
  },
  enterprise: {
    productName: "QuoteGen Enterprise",
    description: "5000 proposte AI al mese · team ampio · supporto prioritario.",
    submitHint: "Attivando Enterprise accetti il rinnovo mensile su QuoteGen."
  }
};

export function planCheckoutCopy(plan: PlanName) {
  return planCopy[plan];
}

/** Stripe non consente `icon`/`logo` in branding_settings con ui_mode embedded_page. */
export function buildCheckoutBrandingSettings(
  baseUrl: string,
  options?: { embedded?: boolean }
): Stripe.Checkout.SessionCreateParams.BrandingSettings {
  const settings: Stripe.Checkout.SessionCreateParams.BrandingSettings = {
    display_name: stripeCheckoutBranding.displayName,
    background_color: stripeCheckoutBranding.backgroundColor,
    button_color: stripeCheckoutBranding.buttonColor,
    border_style: stripeCheckoutBranding.borderStyle,
    font_family: stripeCheckoutBranding.fontFamily
  };

  if (!options?.embedded) {
    const iconUrl = `${baseUrl.replace(/\/$/, "")}/brand/stripe-icon.svg`;
    settings.icon = { type: "url", url: iconUrl };
  }

  return settings;
}

export function buildCheckoutCustomText(plan: PlanName): Stripe.Checkout.SessionCreateParams.CustomText {
  const copy = planCheckoutCopy(plan);
  return {
    submit: { message: copy.submitHint },
    after_submit: {
      message: "Grazie! Tornerai su QuoteGen per iniziare a generare preventivi."
    }
  };
}

export function formatPlanPriceLabel(plan: PlanName) {
  return `€${planCatalog[plan].monthly}/mese · IVA secondo normativa`;
}
