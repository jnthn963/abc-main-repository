import { ReactNode } from 'react';
import GlobalFooter from './GlobalFooter';

/**
 * AppLayout Component
 * 
 * A shared layout wrapper that provides:
 * - min-h-screen with flex-col for sticky footer behavior
 * - Global footer persistence across all pages
 * - Proper z-index management (footer behind modals)
 * 
 * Usage: Wrap page content inside this layout
 */
interface AppLayoutProps {
  children: ReactNode;
  /** Set to true for Governor Dashboard which has different styling */
  isGovernor?: boolean;
  /** Set to true to hide footer (e.g., for full-screen modals) */
  hideFooter?: boolean;
}

export default function AppLayout({ 
  children, 
  isGovernor = false,
  hideFooter = false 
}: AppLayoutProps) {
  return (
    <div 
      className={`min-h-screen flex flex-col ${
        isGovernor ? 'bg-[hsl(222,47%,4%)]' : 'bg-[#050505]'
      }`}
    >
      {/* Main Content - grows to push footer down */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      
      {/* Global Footer - Always at bottom */}
      {!hideFooter && <GlobalFooter />}
    </div>
  );
}
