import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/path";
import { routing, type AppLocale } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;

  if (!locale || !routing.locales.includes(locale as AppLocale)) {
    if (cookieLocale && routing.locales.includes(cookieLocale as AppLocale)) {
      locale = cookieLocale;
    } else {
      locale = routing.defaultLocale;
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
