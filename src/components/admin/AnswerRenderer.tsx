import { CheckCircle2, Circle, ExternalLink, Image as ImageIcon } from "lucide-react"

type FieldType = "PASS_FAIL" | "TEXT" | "SCREENSHOT" | "DROPDOWN" | "CHECKLIST"

interface AnswerRendererProps {
  field: {
    id: string
    label: string
    type: FieldType
    options: unknown
    order: number
  }
  answer: {
    id: string
    value: unknown
  } | null
}

export function AnswerRenderer({ field, answer }: AnswerRendererProps) {
  const value = answer?.value

  switch (field.type) {
    case "PASS_FAIL":
      if (!value) {
        return (
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gray-100 text-gray-500 font-medium text-sm">
            No answer
          </div>
        )
      }
      const isPass = value === "pass" || value === '"pass"'
      return (
        <div className={`inline-flex items-center justify-center px-4 py-2 rounded-full font-medium text-sm ${isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isPass ? "Pass" : "Fail"}
        </div>
      )

    case "TEXT":
      if (!value || typeof value !== "string") {
        return <div className="text-gray-400 italic text-sm">No answer provided</div>
      }
      return (
        <div className="bg-gray-50 rounded-md p-4 border border-gray-200 text-gray-700 text-sm whitespace-pre-wrap">
          {value}
        </div>
      )

    case "SCREENSHOT":
      if (!value || typeof value !== "string") {
        return <div className="text-gray-400 text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4" /> No screenshot uploaded</div>
      }
      return (
        <div className="space-y-2">
          <div className="relative w-full max-h-48 h-48 bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
            {/* Using standard img to avoid next/image domain config issues for local files */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Screenshot" className="w-full h-full object-contain" />
          </div>
          <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#0EA5E9] hover:underline text-sm font-medium">
            View full size <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )

    case "DROPDOWN":
      if (!value || typeof value !== "string") {
        return <div className="text-gray-400 text-sm">No selection</div>
      }
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-sm font-medium">
          {value}
        </div>
      )

    case "CHECKLIST":
      const options = Array.isArray(field.options) ? field.options : []
      const selectedValues = Array.isArray(value) ? value : []
      const completedCount = selectedValues.length

      return (
        <div className="space-y-3">
          <div className="space-y-2">
            {options.map((opt, i) => {
              const isChecked = selectedValues.includes(opt)
              return (
                <div key={i} className="flex items-start gap-2">
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {opt}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="text-sm font-medium text-gray-600 bg-gray-50 inline-block px-3 py-1.5 rounded-md border border-gray-200">
            {completedCount} of {options.length} steps completed
          </div>
        </div>
      )

    default:
      return null
  }
}
