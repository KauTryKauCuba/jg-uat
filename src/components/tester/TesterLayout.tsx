"use client"

import Link from "next/link"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

interface TesterLayoutProps {
  children: React.ReactNode
  title: string
  user: { name?: string | null; role?: string | null }
}

export function TesterLayout({ children, title, user }: TesterLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Bar - Fixed, 56px height */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#E2E8F0] z-50 px-4 flex items-center justify-between shadow-sm">
        {/* Left: Wordmark */}
        <div className="flex-1 flex items-center">
          <Link href="/tester" className="font-bold text-xl tracking-tight text-[#0EA5E9]">
            JobGiga<span className="text-[#1E3A5F]">UAT</span>
          </Link>
        </div>
        
        {/* Center: Title */}
        <div className="flex-[2] flex justify-center">
          <h1 className="text-sm font-semibold text-gray-800 truncate px-4">{title}</h1>
        </div>
        
        {/* Right: User Info & Sign Out */}
        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-medium border border-gray-200">
              {user?.role}
            </span>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-14 min-h-screen">
        {children}
      </main>
    </div>
  )
}
