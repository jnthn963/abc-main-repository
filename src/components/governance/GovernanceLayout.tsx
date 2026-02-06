import { ReactNode } from 'react';
import GovernanceSidebar from './GovernanceSidebar';
import GlobalFooter from '@/components/layout/GlobalFooter';

interface GovernanceLayoutProps {
  children: ReactNode;
}

export default function GovernanceLayout({ children }: GovernanceLayoutProps) {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <div className="flex flex-1">
        <GovernanceSidebar />
        <main className="flex-1 overflow-auto flex flex-col">
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
      {/* Global Footer - Spans full width below sidebar and content */}
      <GlobalFooter />
    </div>
  );
}
