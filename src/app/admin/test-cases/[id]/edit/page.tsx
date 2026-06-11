import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { TestCaseForm } from "@/components/admin/TestCaseForm"
import { notFound } from "next/navigation"

export default async function EditTestCasePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  
  const testCase = await db.testCase.findUnique({
    where: { id },
    include: {
      TestFields: { orderBy: { order: "asc" } }
    }
  })

  if (!testCase) return notFound()

  return (
    <AdminLayout title="Edit Test Case" user={session?.user || {}}>
      <TestCaseForm initialData={testCase as any} />
    </AdminLayout>
  )
}
