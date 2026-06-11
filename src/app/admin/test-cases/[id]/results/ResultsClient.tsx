"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronUp, ChevronDown, ClipboardList } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"

type RunSummary = {
  id: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  submittedAt: string | null
  createdAt: string
  tester: { id: string; name: string; email: string }
  _count: { answers: number }
  passFailSummary: {
    total: number
    passed: number
    failed: number
    unanswered: number
  }
}

export function ResultsClient({ runs, testCaseId }: { runs: RunSummary[], testCaseId: string }) {
  const [sortField, setSortField] = useState<"tester" | "status" | "submittedAt">("submittedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const handleSort = (field: "tester" | "status" | "submittedAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection(field === "tester" ? "asc" : "desc")
    }
  }

  const sortedRuns = [...runs].sort((a, b) => {
    let comparison = 0
    if (sortField === "tester") {
      comparison = a.tester.name.localeCompare(b.tester.name)
    } else if (sortField === "status") {
      comparison = a.status.localeCompare(b.status)
    } else if (sortField === "submittedAt") {
      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
      comparison = timeA - timeB
    }
    
    return sortDirection === "asc" ? comparison : -comparison
  })

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-[#E2E8F0] py-24 shadow-sm mt-6">
        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
          <ClipboardList className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No test runs submitted yet</h3>
        <p className="text-gray-500 mb-6">Test results will appear here once testers start submitting runs.</p>
      </div>
    )
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <div className="w-4 h-4 opacity-0 group-hover:opacity-50" />
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden mt-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b border-[#E2E8F0]">
            <tr>
              <th 
                className="px-6 py-3 font-medium cursor-pointer group hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("tester")}
              >
                <div className="flex items-center gap-1">Tester Name <SortIcon field="tester" /></div>
              </th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th 
                className="px-6 py-3 font-medium cursor-pointer group hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
              </th>
              <th className="px-6 py-3 font-medium">Pass/Fail Summary</th>
              <th 
                className="px-6 py-3 font-medium cursor-pointer group hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("submittedAt")}
              >
                <div className="flex items-center gap-1">Submitted Date <SortIcon field="submittedAt" /></div>
              </th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {sortedRuns.map((run) => (
              <tr key={run.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{run.tester.name}</td>
                <td className="px-6 py-4 text-gray-500">{run.tester.email}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={run.status} />
                </td>
                <td className="px-6 py-4">
                  {run.passFailSummary.total === 0 ? (
                    <span className="text-gray-400">—</span>
                  ) : run.status === "IN_PROGRESS" ? (
                    <span className="text-gray-400 italic">In Progress</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        {run.passFailSummary.passed > 0 && (
                          <div 
                            className="bg-green-500 h-full" 
                            style={{ width: `${(run.passFailSummary.passed / run.passFailSummary.total) * 100}%` }} 
                          />
                        )}
                        {run.passFailSummary.failed > 0 && (
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${(run.passFailSummary.failed / run.passFailSummary.total) * 100}%` }} 
                          />
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                        {run.passFailSummary.passed} / {run.passFailSummary.total} passed
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {run.submittedAt ? new Date(run.submittedAt).toLocaleString() : <span className="text-gray-400 italic">Not submitted</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/admin/test-cases/${testCaseId}/results/${run.id}`} 
                    className="text-[#0EA5E9] hover:underline font-medium"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
