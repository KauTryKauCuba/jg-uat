"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { FieldRenderer } from "@/components/tester/FieldRenderer"
import { ConfirmModal } from "@/components/shared/ConfirmModal"
import { CheckCircle2 } from "lucide-react"

const PDFViewer = dynamic(() => import("@/components/tester/PDFViewer").then(mod => mod.PDFViewer), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0EA5E9] rounded-full animate-spin mb-4" />
      <p>Loading document viewer...</p>
    </div>
  )
})

interface TestRunClientProps {
  run: any
}

export function TestRunClient({ run }: TestRunClientProps) {
  const router = useRouter()
  
  const [answers, setAnswers] = useState<Record<string, any>>(run.answers || {})
  const [isSubmitted, setIsSubmitted] = useState(run.status === "COMPLETED")
  
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounce timeout ref
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Unmount cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleAnswerChange = (testFieldId: string, value: any) => {
    if (isSubmitted) return

    // Optimistic UI update
    setAnswers(prev => ({ ...prev, [testFieldId]: { value } }))
    setSaveStatus("saving")

    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current)

    // Debounce 800ms
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/runs/${run.id}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testFieldId, value })
        })
        
        if (res.ok) {
          setSaveStatus("saved")
          // Clear "saved" status after 2 seconds
          setTimeout(() => setSaveStatus("idle"), 2000)
        } else {
          setSaveStatus("error")
        }
      } catch (err) {
        setSaveStatus("error")
      }
    }, 800)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/runs/${run.id}/submit`, {
        method: "POST"
      })
      if (res.ok) {
        setIsSubmitted(true)
        setSubmitModalOpen(false)
        router.refresh()
      } else {
        const data = await res.json()
        alert("Submit failed: " + data.error)
      }
    } catch (err) {
      alert("Network error during submit")
    }
    setIsSubmitting(false)
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Left Panel - PDF Viewer (75%) */}
      <div className="w-3/4 h-full border-r border-[#E2E8F0] relative">
        <PDFViewer fileUrl={run.testCase.pdfPath} />
      </div>

      {/* Right Panel - Fields (25%) */}
      <div className="w-1/4 h-full flex flex-col bg-white">
        
        {/* Status Header */}
        <div className="h-12 border-b border-[#E2E8F0] px-4 flex items-center justify-between shrink-0 bg-gray-50">
          <span className="text-sm font-semibold text-gray-700 truncate mr-2">
            {run.testCase.title}
          </span>
          <div className="shrink-0 flex items-center">
            {saveStatus === "saving" && <span className="text-xs font-medium text-[#0EA5E9] animate-pulse">Saving...</span>}
            {saveStatus === "saved" && <span className="text-xs font-medium text-green-600">Saved ✓</span>}
            {saveStatus === "error" && <span className="text-xs font-medium text-red-600">Save failed</span>}
          </div>
        </div>

        {/* Fields Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {run.testCase.TestFields.map((field: any, idx: number) => (
            <div key={field.id}>
              <FieldRenderer
                field={field}
                answer={answers[field.id]}
                onChange={handleAnswerChange}
                disabled={isSubmitted}
              />
              {idx < run.testCase.TestFields.length - 1 && (
                <hr className="my-8 border-[#E2E8F0]" />
              )}
            </div>
          ))}
          {run.testCase.TestFields.length === 0 && (
            <p className="text-sm text-gray-500 text-center mt-10">No fields configured for this test.</p>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="p-4 border-t border-[#E2E8F0] bg-gray-50 shrink-0">
          {isSubmitted ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 bg-green-100 text-green-700 py-2.5 rounded-md font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Test Submitted
              </div>
              <button
                onClick={() => router.push("/tester")}
                className="w-full text-center py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Test Cases
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSubmitModalOpen(true)}
              className="w-full bg-[#0EA5E9] text-white font-semibold py-3 rounded-md hover:bg-blue-600 transition-colors"
            >
              Submit Test Run
            </button>
          )}
        </div>

      </div>

      <ConfirmModal
        isOpen={submitModalOpen}
        title="Submit Test Run?"
        message="Are you sure you're ready to submit? Once submitted, you cannot make any further changes to your answers."
        confirmLabel={isSubmitting ? "Submitting..." : "Yes, Submit"}
        onConfirm={handleSubmit}
        onCancel={() => !isSubmitting && setSubmitModalOpen(false)}
      />
    </div>
  )
}
