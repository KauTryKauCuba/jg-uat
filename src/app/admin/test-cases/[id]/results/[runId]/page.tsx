import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AdminLayout } from "@/components/admin/AdminLayout"
import Link from "next/link"
import { ChevronLeft, UserCircle, Download } from "lucide-react"
import { redirect } from "next/navigation"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { PDFViewer } from "@/components/tester/PDFViewer"
import { AnswerRenderer } from "@/components/admin/AnswerRenderer"

export default async function SingleRunDetailPage({ params }: { params: Promise<{ id: string, runId: string }> }) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/login")
  }

  const { id, runId } = await params

  const run = await db.testRun.findUnique({
    where: { id: runId },
    include: {
      tester: {
        select: { id: true, name: true, email: true }
      },
      testCase: {
        include: {
          TestFields: {
            orderBy: { order: "asc" }
          }
        }
      },
      TestAnswers: {
        include: {
          testField: true
        }
      }
    }
  })

  if (!run || run.testCaseId !== id) {
    redirect(`/admin/test-cases/${id}/results`)
  }

  const answersMap: Record<string, any> = {}
  let passedCount = 0
  let failedCount = 0
  let totalPassFailFields = 0

  for (const ans of run.TestAnswers) {
    answersMap[ans.testFieldId] = {
      id: ans.id,
      value: ans.value ? (ans.testField.type !== "TEXT" ? JSON.parse(ans.value) : ans.value) : null
    }
    // Handle the case where the value is JSON serialized
    try {
      if (answersMap[ans.testFieldId].value && typeof answersMap[ans.testFieldId].value === 'string' && ans.testField.type !== "TEXT") {
        answersMap[ans.testFieldId].value = JSON.parse(answersMap[ans.testFieldId].value)
      }
    } catch(e) {}
  }

  for (const field of run.testCase.TestFields) {
    if (field.type === "PASS_FAIL") {
      totalPassFailFields++
      const ans = answersMap[field.id]
      if (ans && ans.value) {
        if (ans.value === "pass") passedCount++
        else if (ans.value === "fail") failedCount++
      }
    }
  }

  let verdict = "Partial"
  let verdictColor = "bg-yellow-100 text-yellow-700"
  
  if (totalPassFailFields > 0) {
    if (passedCount === totalPassFailFields) {
      verdict = "Passed"
      verdictColor = "bg-green-100 text-green-700"
    } else if (failedCount === totalPassFailFields) {
      verdict = "Failed"
      verdictColor = "bg-red-100 text-red-700"
    } else if (passedCount > 0 || failedCount > 0) {
      verdict = "Partial"
      verdictColor = "bg-yellow-100 text-yellow-700"
    } else {
      verdict = "No answers"
      verdictColor = "bg-gray-100 text-gray-700"
    }
  }

  const submittedDate = run.completedAt ? new Date(run.completedAt).toLocaleString() : "Not submitted yet"

  return (
    <AdminLayout 
      title={
        <div className="flex items-center gap-3">
          <Link href={`/admin/test-cases/${id}/results`} className="text-gray-400 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span>Run by {run.tester.name}</span>
        </div>
      }
      user={session.user}
      actionSlot={
        <div className="flex items-center gap-4">
          <StatusBadge status={run.status} />
          {run.status === "COMPLETED" && (
            <a 
              href={`/api/runs/${run.id}/export`} 
              className="flex items-center gap-2 bg-white border border-[#E2E8F0] hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
              target="_blank"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </a>
          )}
        </div>
      }
    >
      <div className="flex h-[calc(100vh-140px)] gap-6">
        {/* LEFT COLUMN: PDF Viewer (75%) */}
        <div className="w-[75%] h-full flex flex-col bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] bg-gray-50">
            <h3 className="font-semibold text-gray-900">Reference Document</h3>
          </div>
          <div className="flex-1 overflow-hidden relative">
            {run.testCase.pdfPath ? (
              <PDFViewer fileUrl={run.testCase.pdfPath} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No PDF document attached to this test case.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Answers Panel (25%) */}
        <div className="w-[25%] h-full flex flex-col bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] bg-gray-50">
            <h3 className="font-semibold text-gray-900">Tester Responses</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex items-start gap-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <UserCircle className="w-10 h-10 text-blue-500 shrink-0" />
              <div>
                <div className="font-medium text-gray-900">{run.tester.name}</div>
                <div className="text-xs text-gray-500">{run.tester.email}</div>
                <div className="text-xs text-gray-400 mt-1">Submitted: {submittedDate}</div>
              </div>
            </div>

            <hr className="border-[#E2E8F0]" />

            <div className="space-y-8">
              {run.testCase.TestFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <label className="font-semibold text-sm text-gray-900 leading-tight">
                      {field.label}
                    </label>
                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                      {field.type.replace('_', ' ')}
                    </span>
                  </div>
                  <AnswerRenderer 
                    field={{
                      ...field,
                      options: field.options ? JSON.parse(field.options) : null
                    }} 
                    answer={answersMap[field.id] || null} 
                  />
                </div>
              ))}
            </div>
            
            {/* Add padding at bottom to ensure last item is visible */}
            <div className="h-4"></div>
          </div>

          {/* Pass/Fail Summary Card at Bottom */}
          {totalPassFailFields > 0 && (
            <div className="p-4 border-t border-[#E2E8F0] bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-sm text-gray-700">Pass / Fail Summary</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${verdictColor}`}>
                  {verdict}
                </span>
              </div>
              
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex">
                {passedCount > 0 && (
                  <div className="bg-green-500 h-full" style={{ width: `${(passedCount / totalPassFailFields) * 100}%` }} />
                )}
                {failedCount > 0 && (
                  <div className="bg-red-500 h-full" style={{ width: `${(failedCount / totalPassFailFields) * 100}%` }} />
                )}
              </div>
              
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{passedCount} Passed</span>
                <span>{failedCount} Failed</span>
                <span>{totalPassFailFields} Total</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
