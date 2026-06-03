import { ProposalThemeLock } from "@/components/proposals/proposal-theme-lock";

export default function PublicProposalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProposalThemeLock />
      {children}
    </>
  );
}
