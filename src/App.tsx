import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { MemberDataProvider } from "@/hooks/useMemberData";
import { AnimatedRoutes } from "@/components/transitions/AnimatedRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MemberDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {/* Add basename here to match your Hostinger subfolder and Vite config */}
          <BrowserRouter basename="/ABC-TECH">
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </MemberDataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
