import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { createTestCaseSchema } from "@/lib/validations"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role === "ADMIN") {
      const testCases = await db.testCase.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          pdfPath: true,
          createdAt: true,
          _count: {
            select: { TestFields: true, TestRuns: true }
          }
        }
      })
      return NextResponse.json({ data: testCases })
    }

    if (session.user.role === "TESTER") {
      const testCases = await db.testCase.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { TestFields: true }
          },
          TestRuns: {
            where: { testerId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      const mapped = testCases.map((tc: any) => {
        let testerStatus = "not_started"
        let runId = null
        if (tc.TestRuns.length > 0) {
          const run = tc.TestRuns[0]
          runId = run.id
          if (run.status === "COMPLETED") {
            testerStatus = "submitted"
          } else if (run.status === "IN_PROGRESS" || run.status === "PENDING") {
            testerStatus = "in_progress"
          }
        }

        return {
          id: tc.id,
          title: tc.title,
          description: tc.description,
          pdfPath: tc.pdfPath,
          createdAt: tc.createdAt,
          _count: tc._count,
          testerStatus,
          runId
        }
      })

      return NextResponse.json({ data: mapped })
    }

    return NextResponse.json({ error: "Unauthorized role" }, { status: 403 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validation = createTestCaseSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    const testCase = await db.testCase.create({
      data: {
        title: validation.data.title,
        description: validation.data.description,
        pdfPath: validation.data.pdfPath,
      }
    })

    return NextResponse.json({ data: testCase }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
