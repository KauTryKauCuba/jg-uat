"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, ClipboardList, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

interface AdminLayoutProps {
  title: React.ReactNode
  actionSlot?: React.ReactNode
  children: React.ReactNode
  user: { name?: string | null; role?: string | null }
}

export function AdminLayout({ title, actionSlot, children, user }: AdminLayoutProps) {
  const pathname = usePathname()

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/test-cases", label: "Test Cases", icon: ClipboardList },
  ]

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-[240px] bg-white border-r border-[#E2E8F0] flex flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0EA5E9] rounded-md flex items-center justify-center text-white font-bold shrink-0">
              JG
            </div>
            <h1 className="text-xl font-bold text-[#1E3A5F]">JobGiga UAT</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href))
            const Icon = link.icon

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-[#0EA5E9]/10 text-[#0EA5E9] border-l-4 border-[#0EA5E9]"
                    : "text-gray-600 hover:bg-gray-100 border-l-4 border-transparent"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#E2E8F0]">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <span className="inline-block mt-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
              {user?.role}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[240px] flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
          <h2 className="text-xl font-semibold text-[#1E3A5F]">{title}</h2>
          {actionSlot && <div>{actionSlot}</div>}
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
