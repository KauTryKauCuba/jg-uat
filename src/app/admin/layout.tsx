import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login")
  }

  // The actual UI shell (AdminLayout) is rendered per-page
  // so that each page can pass its own dynamic title and action slot.
  return <>{children}</>
}
