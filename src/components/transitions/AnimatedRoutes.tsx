import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageTransition } from "./PageTransition";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import GovernorLogin from "@/pages/GovernorLogin";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import GovernorDashboard from "@/pages/GovernorDashboard";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import ArticlesOfCooperation from "@/pages/governance/ArticlesOfCooperation";
import BoardOfDirectors from "@/pages/governance/BoardOfDirectors";
import GeneralAssembly from "@/pages/governance/GeneralAssembly";
import Ideology from "@/pages/governance/Ideology";

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Landing />
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/governor-login"
          element={
            <PageTransition>
              <GovernorLogin />
            </PageTransition>
          }
        />
        <Route
          path="/register"
          element={
            <PageTransition>
              <Register />
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PageTransition>
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/profile"
          element={
            <PageTransition>
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/governor"
          element={
            <PageTransition>
              <ProtectedRoute requiredRole="governor">
                <GovernorDashboard />
              </ProtectedRoute>
            </PageTransition>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PageTransition>
              <ResetPassword />
            </PageTransition>
          }
        />
        <Route
          path="/governance/articles"
          element={
            <PageTransition>
              <ArticlesOfCooperation />
            </PageTransition>
          }
        />
        <Route
          path="/governance/board"
          element={
            <PageTransition>
              <BoardOfDirectors />
            </PageTransition>
          }
        />
        <Route
          path="/governance/assembly"
          element={
            <PageTransition>
              <GeneralAssembly />
            </PageTransition>
          }
        />
        <Route
          path="/governance/ideology"
          element={
            <PageTransition>
              <Ideology />
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default AnimatedRoutes;
