import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function TesterRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session || session.user?.role !== "TESTER") {
    redirect("/login")
  }

  // The actual UI shell (TesterLayout) is rendered per-page
  return <>{children}</>
}
