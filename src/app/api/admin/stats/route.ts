import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const totalTestCases = await db.testCase.count()
    const totalRuns = await db.testRun.count()
    const submittedRuns = await db.testRun.count({ where: { status: "COMPLETED" } })
    const inProgressRuns = await db.testRun.count({ where: { status: "IN_PROGRESS" } })

    // Calculate pass rate
    const completedRunsWithPassFail = await db.testRun.findMany({
      where: {
        status: "COMPLETED",
        testCase: {
          TestFields: {
            some: { type: "PASS_FAIL" }
          }
        }
      },
      include: {
        TestAnswers: {
          include: {
            testField: true
          }
        }
      }
    })

    let passRate = 0
    if (completedRunsWithPassFail.length > 0) {
      let passedRuns = 0
      for (const run of completedRunsWithPassFail) {
        const hasPass = run.TestAnswers.some(ans => 
          ans.testField.type === "PASS_FAIL" && 
          (ans.value === "pass" || ans.value === '"pass"')
        )
        if (hasPass) {
          passedRuns++
        }
      }
      passRate = Math.round((passedRuns / completedRunsWithPassFail.length) * 100)
    }

    // Recent test cases
    const recentTestCases = await db.testCase.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { TestFields: true, TestRuns: true }
        }
      }
    })

    // Top testers
    const topTestersData = await db.testRun.groupBy({
      by: ['testerId'],
      where: { status: "COMPLETED" },
      _count: {
        id: true
      },
      orderBy: {
        _count: { id: "desc" }
      },
      take: 5
    })

    const topTesters = []
    for (const item of topTestersData) {
      const tester = await db.user.findUnique({
        where: { id: item.testerId },
        select: { id: true, name: true, email: true }
      })
      if (tester) {
        topTesters.push({
          tester,
          submittedCount: item._count.id
        })
      }
    }

    return NextResponse.json({
      data: {
        stats: {
          totalTestCases,
          totalRuns,
          submittedRuns,
          inProgressRuns,
          passRate,
          recentTestCases,
          topTesters
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
