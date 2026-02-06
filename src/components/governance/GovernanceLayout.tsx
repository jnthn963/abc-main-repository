import { ReactNode } from 'react';
import GovernanceSidebar from './GovernanceSidebar';

interface GovernanceLayoutProps {
  children: ReactNode;
}

export default function GovernanceLayout({ children }: GovernanceLayoutProps) {
  return (
    <div className="min-h-screen bg-[#050505] flex">
      <GovernanceSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
