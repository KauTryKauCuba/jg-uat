import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AdminLayout } from "@/components/admin/AdminLayout"
import Link from "next/link"
import { ClipboardList, Activity, CheckCircle2, TrendingUp, Plus, UserCircle } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"

export default async function AdminDashboardPage() {
  const session = await auth()
  
  // 1. Stats
  const totalCases = await db.testCase.count()
  const totalRuns = await db.testRun.count()
  const submittedRuns = await db.testRun.count({ where: { status: "COMPLETED" } })
  const inProgressRunsCount = await db.testRun.count({ where: { status: "IN_PROGRESS" } })

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
        include: { testField: true }
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

  // 2. Recent Test Cases
  const recentCases = await db.testCase.findMany({
    take: 5,
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

  // 3. Top Testers
  const topTestersData = await db.testRun.groupBy({
    by: ['testerId'],
    where: { status: "COMPLETED" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5
  })

  const topTesters = []
  for (const item of topTestersData) {
    const tester = await db.user.findUnique({
      where: { id: item.testerId },
      select: { id: true, name: true, email: true }
    })
    if (tester) {
      topTesters.push({ tester, submittedCount: item._count.id })
    }
  }

  // 4. In Progress Runs
  const inProgressRunsList = await db.testRun.findMany({
    where: { status: "IN_PROGRESS" },
    take: 10,
    orderBy: { startedAt: "desc" },
    include: {
      tester: { select: { name: true } },
      testCase: { select: { title: true } }
    }
  })

  return (
    <AdminLayout 
      title="Dashboard" 
      user={session?.user || {}}
      actionSlot={
        <Link href="/admin/test-cases/new" className="flex items-center gap-2 bg-[#0EA5E9] hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Create New Test Case
        </Link>
      }
    >
      {/* Row 1: Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-[#1E3A5F] rounded-lg"><ClipboardList className="w-6 h-6" /></div>
          <div><p className="text-sm text-gray-500 font-medium">Total Test Cases</p><p className="text-2xl font-bold text-gray-900">{totalCases}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-cyan-50 text-[#0EA5E9] rounded-lg"><Activity className="w-6 h-6" /></div>
          <div><p className="text-sm text-gray-500 font-medium">Total Runs</p><p className="text-2xl font-bold text-gray-900">{totalRuns}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-sm text-gray-500 font-medium">Submitted Runs</p><p className="text-2xl font-bold text-gray-900">{submittedRuns}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-sm text-gray-500 font-medium">Overall Pass Rate</p><p className="text-2xl font-bold text-gray-900">{passRate}%</p></div>
        </div>
      </div>

      {/* Row 2: Recent Test Cases (60%) & Top Testers (40%) */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        {/* Left Col: Recent Test Cases */}
        <div className="lg:w-[60%] bg-white rounded-lg border border-[#E2E8F0] shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Test Cases</h3>
            <Link href="/admin/test-cases" className="text-sm text-[#0EA5E9] hover:underline font-medium">View all</Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Fields</th>
                  <th className="px-6 py-3 font-medium">Runs</th>
                  <th className="px-6 py-3 font-medium">Pass Rate</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {recentCases.map((tc) => {
                  let tcPassRate = 0
                  if (tc.TestRuns.length > 0) {
                    let tcPassed = 0
                    for (const run of tc.TestRuns) {
                      const hasPass = run.TestAnswers.some(ans => ans.testField.type === "PASS_FAIL" && (ans.value === "pass" || ans.value === '"pass"'))
                      if (hasPass) tcPassed++
                    }
                    tcPassRate = Math.round((tcPassed / tc.TestRuns.length) * 100)
                  }
                  
                  return (
                    <tr key={tc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 max-w-[200px] truncate" title={tc.title}>{tc.title}</td>
                      <td className="px-6 py-4 text-gray-500">{tc._count.TestFields}</td>
                      <td className="px-6 py-4 text-gray-500">{tc._count.TestRuns}</td>
                      <td className="px-6 py-4 text-gray-500">{tc.TestRuns.length > 0 ? `${tcPassRate}%` : "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/test-cases/${tc.id}/edit`} className="text-[#0EA5E9] hover:underline mr-4 font-medium">Edit</Link>
                        <Link href={`/admin/test-cases/${tc.id}/results`} className="text-[#0EA5E9] hover:underline font-medium">Results</Link>
                      </td>
                    </tr>
                  )
                })}
                {recentCases.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No test cases found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Top Testers */}
        <div className="lg:w-[40%] bg-white rounded-lg border border-[#E2E8F0] shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h3 className="font-semibold text-gray-900">Top Testers</h3>
          </div>
          <div className="p-6 flex-1">
            {topTesters.length > 0 ? (
              <div className="space-y-4">
                {topTesters.map((item, index) => (
                  <div key={item.tester.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <UserCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.tester.name}</div>
                        <div className="text-xs text-gray-500">{item.tester.email}</div>
                      </div>
                    </div>
                    <div className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100">
                      {item.submittedCount} runs
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 italic">
                No submissions yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: In Progress Runs */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="font-semibold text-gray-900">In Progress Runs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-[#E2E8F0]">
              <tr>
                <th className="px-6 py-3 font-medium">Tester Name</th>
                <th className="px-6 py-3 font-medium">Test Case</th>
                <th className="px-6 py-3 font-medium">Started</th>
                <th className="px-6 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {inProgressRunsList.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{run.tester.name}</td>
                  <td className="px-6 py-4 text-gray-500">{run.testCase.title}</td>
                  <td className="px-6 py-4 text-gray-500">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"}</td>
                  <td className="px-6 py-4 text-right">
                    <StatusBadge status={run.status} />
                  </td>
                </tr>
              ))}
              {inProgressRunsList.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">No in-progress runs at the moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
