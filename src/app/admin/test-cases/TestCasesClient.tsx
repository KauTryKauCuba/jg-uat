"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, BarChart2, Trash2, FolderOpen, Search } from "lucide-react"
import { ConfirmModal } from "@/components/shared/ConfirmModal"

type TestCaseRow = {
  id: string
  title: string
  createdAt: Date
  _count: { TestFields: number; TestRuns: number }
  passRate: number
}

export function TestCasesClient({ initialData }: { initialData: TestCaseRow[] }) {
  const [testCases, setTestCases] = useState<TestCaseRow[]>(initialData)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const confirmDelete = async () => {
    if (!caseToDelete) return
    setIsDeleting(true)
    
    try {
      const res = await fetch(`/api/test-cases/${caseToDelete}`, { method: "DELETE" })
      if (res.ok) {
        setTestCases(testCases.filter(tc => tc.id !== caseToDelete))
      }
    } catch (e) {
      console.error("Failed to delete", e)
    } finally {
      setIsDeleting(false)
      setDeleteModalOpen(false)
      setCaseToDelete(null)
    }
  }

  const filteredCases = testCases.filter(tc => 
    tc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="mb-6 flex items-center bg-white border border-[#E2E8F0] rounded-md px-3 py-2 shadow-sm max-w-md focus-within:ring-2 focus-within:ring-[#0EA5E9] focus-within:border-[#0EA5E9] transition-all">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search test cases by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-400 text-gray-900"
        />
      </div>

      {testCases.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-[#E2E8F0] py-24 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No test cases yet</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first test case.</p>
          <Link href="/admin/test-cases/new" className="bg-[#0EA5E9] hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors">
            Create Test Case
          </Link>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-[#E2E8F0] py-24 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No matching test cases</h3>
          <p className="text-gray-500">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Fields Count</th>
                  <th className="px-6 py-3 font-medium">Runs Count</th>
                  <th className="px-6 py-3 font-medium">Pass Rate</th>
                  <th className="px-6 py-3 font-medium">Created Date</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{tc.title}</td>
                    <td className="px-6 py-4 text-gray-500">{tc._count.TestFields}</td>
                    <td className="px-6 py-4 text-gray-500">{tc._count.TestRuns}</td>
                    <td className="px-6 py-4 text-gray-500">{tc._count.TestRuns > 0 ? `${tc.passRate}%` : "—"}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(tc.createdAt).toISOString().split('T')[0]}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <Link href={`/admin/test-cases/${tc.id}/edit`} className="text-gray-400 hover:text-[#0EA5E9] transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <Link href={`/admin/test-cases/${tc.id}/results`} className="text-gray-400 hover:text-[#0EA5E9] transition-colors" title="View Results">
                          <BarChart2 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => {
                            setCaseToDelete(tc.id)
                            setDeleteModalOpen(true)
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Test Case"
        message="Are you sure you want to delete this test case? All fields, test runs, and answers will be permanently deleted. This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (isDeleting) return
          setDeleteModalOpen(false)
          setCaseToDelete(null)
        }}
        variant="danger"
      />
    </>
  )
}
