import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AdminLayout } from "@/components/admin/AdminLayout"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ResultsClient } from "./ResultsClient"
import { redirect } from "next/navigation"

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login")
  }

  const { id } = await params

  const testCase = await db.testCase.findUnique({
    where: { id },
    include: {
      TestFields: {
        where: { type: "PASS_FAIL" }
      }
    }
  })

  if (!testCase) {
    redirect("/admin/test-cases")
  }

  const passFailFieldIds = testCase.TestFields.map(f => f.id)
  const totalPassFailFields = passFailFieldIds.length

  const runs = await db.testRun.findMany({
    where: { testCaseId: id },
    include: {
      tester: {
        select: { id: true, name: true, email: true }
      },
      _count: {
        select: { TestAnswers: true }
      },
      TestAnswers: {
        where: {
          testFieldId: { in: passFailFieldIds }
        }
      }
    },
    orderBy: [
      { completedAt: "desc" },
      { createdAt: "desc" }
    ]
  })

  let totalSubmitted = 0
  let totalInProgress = 0
  let totalPassedRuns = 0 // runs with at least one "pass"
  
  const mappedRuns = runs.map(run => {
    if (run.status === "COMPLETED") totalSubmitted++
    if (run.status === "IN_PROGRESS") totalInProgress++

    let passed = 0
    let failed = 0
    let hasPass = false

    for (const ans of run.TestAnswers) {
      if (ans.value === "pass" || ans.value === '"pass"') {
        passed++
        hasPass = true
      } else if (ans.value === "fail" || ans.value === '"fail"') {
        failed++
      }
    }
    
    if (run.status === "COMPLETED" && hasPass) {
      totalPassedRuns++
    }

    const unanswered = totalPassFailFields - (passed + failed)

    return {
      id: run.id,
      status: run.status,
      submittedAt: run.completedAt ? run.completedAt.toISOString() : null,
      createdAt: run.createdAt.toISOString(),
      tester: run.tester,
      _count: { answers: run._count.TestAnswers },
      passFailSummary: {
        total: totalPassFailFields,
        passed,
        failed,
        unanswered: Math.max(0, unanswered)
      }
    }
  })

  const passRate = totalSubmitted > 0 ? Math.round((totalPassedRuns / totalSubmitted) * 100) : 0

  return (
    <AdminLayout 
      title={
        <div className="flex items-center gap-3">
          <Link href="/admin/test-cases" className="text-gray-400 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span>{testCase.title} — Results</span>
        </div>
      }
      user={session.user}
    >
      <div className="flex gap-4 mb-2 text-sm">
        <div className="bg-white px-4 py-2 rounded-md border border-[#E2E8F0] shadow-sm">
          <span className="text-gray-500">Total Runs:</span> <span className="font-semibold text-gray-900">{runs.length}</span>
        </div>
        <div className="bg-white px-4 py-2 rounded-md border border-[#E2E8F0] shadow-sm">
          <span className="text-gray-500">Submitted:</span> <span className="font-semibold text-gray-900">{totalSubmitted}</span>
        </div>
        <div className="bg-white px-4 py-2 rounded-md border border-[#E2E8F0] shadow-sm">
          <span className="text-gray-500">In Progress:</span> <span className="font-semibold text-gray-900">{totalInProgress}</span>
        </div>
        <div className="bg-white px-4 py-2 rounded-md border border-[#E2E8F0] shadow-sm">
          <span className="text-gray-500">Average Pass Rate:</span> <span className="font-semibold text-gray-900">{passRate}%</span>
        </div>
      </div>

      <ResultsClient runs={mappedRuns} testCaseId={testCase.id} />
    </AdminLayout>
  )
}
