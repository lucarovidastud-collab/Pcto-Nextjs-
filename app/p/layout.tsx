import { ProposalThemeLock } from "@/components/proposals/proposal-theme-lock";

export default function PublicProposalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light';"
        }}
      />
      <ProposalThemeLock />
      {children}
    </>
  );
}
