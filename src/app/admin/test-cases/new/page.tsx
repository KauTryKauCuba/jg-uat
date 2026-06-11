import { auth } from "@/lib/auth"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { TestCaseForm } from "@/components/admin/TestCaseForm"

export default async function NewTestCasePage() {
  const session = await auth()
  
  return (
    <AdminLayout title="Create Test Case" user={session?.user || {}}>
      <TestCaseForm />
    </AdminLayout>
  )
}
