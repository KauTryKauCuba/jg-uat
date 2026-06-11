import { TesterLayout } from "@/components/tester/TesterLayout"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { TesterActionCard } from "@/components/tester/TesterActionCard"

export default async function TesterHomePage() {
  const session = await auth()
  const userId = session?.user?.id

  // Fetch all test cases
  const testCases = await db.testCase.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { TestFields: true }
      },
      TestRuns: {
        where: { testerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  // Map to attach testerStatus
  const mappedTestCases = testCases.map((tc: any) => {
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
      ...tc,
      testerStatus,
      runId
    }
  })

  return (
    <TesterLayout title="Available Test Cases" user={session?.user || {}}>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1E3A5F]">Available Test Cases</h2>
          <p className="text-gray-500 mt-1">Select a test case below to begin your execution run.</p>
        </div>

        {mappedTestCases.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#E2E8F0] rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">No test cases available yet.</h3>
            <p className="mt-1 text-gray-500">Check back later when an admin assigns you new tests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mappedTestCases.map((tc: any) => (
              <TesterActionCard key={tc.id} testCase={tc} />
            ))}
          </div>
        )}
      </div>
    </TesterLayout>
  )
}
