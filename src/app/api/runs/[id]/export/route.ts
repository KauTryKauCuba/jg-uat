import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params

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
        TestAnswers: {
          include: {
            testField: true
          }
        }
      }
    })

    if (!run) {
      return NextResponse.json({ error: "Test run not found" }, { status: 404 })
    }

    // Format the date
    const submittedAt = run.completedAt ? new Date(run.completedAt).toISOString() : "Not submitted"

    // Build CSV Header
    let csvString = "Field Label,Field Type,Answer,Screenshot URL,Submitted At\n"

    // Map answers for easy lookup
    const answersMap: Record<string, { value: string | null }> = {}
    for (const ans of run.TestAnswers) {
      answersMap[ans.testFieldId] = {
        value: ans.value,
      }
    }

    // Build CSV Rows
    for (const field of run.testCase.TestFields) {
      const label = `"${field.label.replace(/"/g, '""')}"`
      const type = field.type
      
      let answerText = ""
      let screenshotUrl = ""
      
      const ans = answersMap[field.id]
      if (ans && ans.value) {
        let parsedValue = ans.value
        try {
          parsedValue = JSON.parse(ans.value)
        } catch (e) {
          // If not json, keep as is
        }
        
        if (type === "SCREENSHOT") {
          screenshotUrl = parsedValue || ""
        } else if (type === "CHECKLIST") {
          if (Array.isArray(parsedValue)) {
            answerText = parsedValue.join("; ")
          } else {
            answerText = String(parsedValue)
          }
        } else {
          answerText = String(parsedValue)
        }
      } else {
        answerText = "No answer"
      }
      
      answerText = `"${answerText.replace(/"/g, '""')}"`
      
      csvString += `${label},${type},${answerText},${screenshotUrl},${submittedAt}\n`
    }

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="run-${run.id}-results.csv"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
