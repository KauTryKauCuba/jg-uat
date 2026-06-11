import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AdminLayout } from "@/components/admin/AdminLayout"
import Link from "next/link"
import { Plus } from "lucide-react"
import { TestCasesClient } from "./TestCasesClient"

export default async function TestCasesPage() {
  const session = await auth()
  
  const testCasesData = await db.testCase.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { TestFields: true, TestRuns: true }
      },
      TestRuns: {
        where: { status: "COMPLETED" },
        include: {
          TestAnswers: { include: { testField: true } }
        }
      }
    }
  })

  const testCases = testCasesData.map(tc => {
    let passRate = 0
    if (tc.TestRuns.length > 0) {
      let passedRuns = 0
      for (const run of tc.TestRuns) {
        const hasPass = run.TestAnswers.some(ans => 
          ans.testField.type === "PASS_FAIL" && 
          (ans.value === "pass" || ans.value === '"pass"')
        )
        if (hasPass) passedRuns++
      }
      passRate = Math.round((passedRuns / tc.TestRuns.length) * 100)
    }

    return {
      id: tc.id,
      title: tc.title,
      createdAt: tc.createdAt,
      _count: tc._count,
      passRate
    }
  })

  return (
    <AdminLayout 
      title="Test Cases" 
      user={session?.user || {}}
      actionSlot={
        <Link href="/admin/test-cases/new" className="flex items-center gap-2 bg-[#0EA5E9] hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Create New Test Case
        </Link>
      }
    >
      <TestCasesClient initialData={testCases} />
    </AdminLayout>
  )
}
