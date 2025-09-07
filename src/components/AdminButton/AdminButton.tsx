'use client'
import Link from "next/link";
import { Settings } from "lucide-react";
import { useAuth } from "../../context/auth/AuthContext.context";

export default function AdminButton() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <Link 
      href="/admin/dashboard" 
      className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
    >
      <Settings className="w-4 h-4" />
      <span>Admin</span>
    </Link>
  );
}