import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "TESTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params

    // Check if test case exists
    const testCase = await db.testCase.findUnique({
      where: { id }
    })
    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
    }

    // Check if an existing in-progress run exists for this tester
    const existingRun = await db.testRun.findFirst({
      where: {
        testCaseId: id,
        testerId: session.user.id,
        status: { in: ["PENDING", "IN_PROGRESS"] }
      },
      orderBy: { createdAt: "desc" }
    })

    if (existingRun) {
      // Return existing run
      return NextResponse.json({ data: { runId: existingRun.id } })
    }

    // Create a new run
    const newRun = await db.testRun.create({
      data: {
        testCaseId: id,
        testerId: session.user.id as string,
        status: "IN_PROGRESS",
        startedAt: new Date()
      }
    })

    return NextResponse.json({ data: { runId: newRun.id } }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params

    const testCase = await db.testCase.findUnique({
      where: { id },
      include: {
        TestFields: {
          where: { type: "PASS_FAIL" }
        }
      }
    })

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
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

    const mappedRuns = runs.map(run => {
      let passed = 0
      let failed = 0
      for (const ans of run.TestAnswers) {
        if (ans.value === "pass" || ans.value === '"pass"') {
          passed++
        } else if (ans.value === "fail" || ans.value === '"fail"') {
          failed++
        }
      }
      
      const unanswered = totalPassFailFields - (passed + failed)

      return {
        id: run.id,
        status: run.status,
        submittedAt: run.completedAt,
        createdAt: run.createdAt,
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

    return NextResponse.json({ data: { runs: mappedRuns } })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
