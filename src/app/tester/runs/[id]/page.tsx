import { TesterLayout } from "@/components/tester/TesterLayout"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { TestRunClient } from "@/components/tester/TestRunClient"

export default async function TestRunPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user?.role !== "TESTER") {
    redirect("/login")
  }

  const { id } = await params

  // Fetch full run detail
  const run = await db.testRun.findUnique({
    where: { id },
    include: {
      testCase: {
        include: {
          TestFields: {
            orderBy: { order: "asc" }
          }
        }
      },
      TestAnswers: true
    }
  })

  if (!run || run.testerId !== session.user.id) {
    redirect("/tester")
  }

  // Map answers by testFieldId
  const answersMap: Record<string, any> = {}
  for (const ans of run.TestAnswers) {
    answersMap[ans.testFieldId] = {
      id: ans.id,
      value: ans.value ? JSON.parse(ans.value) : null
    }
  }

  // Map test fields options
  const mappedFields = run.testCase.TestFields.map((f: any) => ({
    id: f.id,
    label: f.label,
    type: f.type,
    options: f.options ? JSON.parse(f.options) : null,
    order: f.order
  }))

  const mappedRun = {
    id: run.id,
    status: run.status,
    completedAt: run.completedAt,
    startedAt: run.startedAt,
    testCase: {
      id: run.testCase.id,
      title: run.testCase.title,
      pdfPath: run.testCase.pdfPath,
      TestFields: mappedFields
    },
    answers: answersMap
  }

  return (
    <TesterLayout title={mappedRun.testCase.title} user={session.user}>
      <TestRunClient run={mappedRun} />
    </TesterLayout>
  )
}
