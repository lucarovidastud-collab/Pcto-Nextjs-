import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.25 : 1,
  enableLogs: true,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1,
  replaysOnErrorSampleRate: 1,
  sendDefaultPii: false
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
