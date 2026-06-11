"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Play, ArrowRight, Eye } from "lucide-react"

interface TesterActionCardProps {
  testCase: any
}

export function TesterActionCard({ testCase }: TesterActionCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async () => {
    if (testCase.testerStatus === "submitted" && testCase.runId) {
      router.push(`/tester/runs/${testCase.runId}`)
      return
    }

    if (testCase.testerStatus === "in_progress" && testCase.runId) {
      router.push(`/tester/runs/${testCase.runId}`)
      return
    }

    // Start Test
    setIsLoading(true)
    try {
      const res = await fetch(`/api/test-cases/${testCase.id}/runs`, {
        method: "POST"
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/tester/runs/${data.data.runId}`)
      } else {
        alert("Failed to start test: " + data.error)
        setIsLoading(false)
      }
    } catch (err) {
      alert("Network error")
      setIsLoading(false)
    }
  }

  let buttonContent = null
  let buttonClasses = ""

  if (testCase.testerStatus === "submitted") {
    buttonClasses = "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
    buttonContent = <><Eye className="w-4 h-4" /> View Result</>
  } else if (testCase.testerStatus === "in_progress") {
    buttonClasses = "bg-[#1E3A5F] text-white hover:bg-[#0F172A]"
    buttonContent = <><ArrowRight className="w-4 h-4" /> Continue</>
  } else {
    buttonClasses = "bg-[#0EA5E9] text-white hover:bg-blue-600"
    buttonContent = <><Play className="w-4 h-4" /> Start Test</>
  }

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-[#0F172A] text-lg leading-tight mb-2 line-clamp-1">
          {testCase.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
          {testCase.description || "No description provided."}
        </p>
        <div className="text-sm text-gray-500 mb-4 font-medium">
          {testCase._count.TestFields} fields
        </div>
      </div>
      
      <div className="px-5 py-4 bg-gray-50 border-t border-[#E2E8F0] flex items-center justify-between rounded-b-lg">
        <StatusBadge status={testCase.testerStatus} />
        <button
          onClick={handleAction}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${buttonClasses} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : buttonContent}
        </button>
      </div>
    </div>
  )
}
