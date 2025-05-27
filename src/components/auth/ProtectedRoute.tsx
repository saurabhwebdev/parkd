import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();

  // While checking authentication state, show a loading spinner or nothing
  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-white">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  // If authenticated, render the children
  return <>{children}</>;
} 