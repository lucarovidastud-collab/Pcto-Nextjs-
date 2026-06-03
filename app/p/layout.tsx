import { ProposalThemeLock } from "@/components/proposals/proposal-theme-lock";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export default async function PublicProposalLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light';"
        }}
      />
      <ProposalThemeLock />
      {children}
    </NextIntlClientProvider>
  );
}
