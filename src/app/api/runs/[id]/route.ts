import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params

    const run = await db.testRun.findUnique({
      where: { id },
      include: {
        tester: {
          select: {
            id: true,
            name: true,
            email: true,
          }
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

    if (!run) {
      return NextResponse.json({ error: "Test run not found" }, { status: 404 })
    }

    // Check ownership or admin
    if (session.user.role !== "ADMIN" && run.testerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const answers = run.TestAnswers.map((ans) => ({
      id: ans.id,
      testFieldId: ans.testFieldId,
      value: ans.value ? JSON.parse(ans.value) : null,
      createdAt: ans.createdAt,
      testField: {
        label: ans.testField.label,
        fieldType: ans.testField.type,
        options: ans.testField.options ? JSON.parse(ans.testField.options) : null,
        order: ans.testField.order
      }
    }))

    const mappedFields = run.testCase.TestFields.map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type,
      options: f.options ? JSON.parse(f.options) : null,
      order: f.order
    }))

    const data = {
      id: run.id,
      status: run.status,
      submittedAt: run.completedAt, // Map completedAt to submittedAt as per requirements
      createdAt: run.createdAt,
      tester: run.tester,
      testCase: {
        id: run.testCase.id,
        title: run.testCase.title,
        pdfUrl: run.testCase.pdfPath, // Map pdfPath to pdfUrl
        fields: mappedFields
      },
      answers
    }

    return NextResponse.json({ data: { run: data } })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
