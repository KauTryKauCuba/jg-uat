"use client"

import { useState, useRef } from "react"
import { CheckCircle2, XCircle, UploadCloud, X } from "lucide-react"

interface FieldRendererProps {
  field: any
  answer: any
  onChange: (testFieldId: string, value: any) => void
  disabled?: boolean
}

export function FieldRenderer({ field, answer, onChange, disabled = false }: FieldRendererProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setUploadError("Must be PNG, JPEG, or WebP")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB")
      return
    }

    setIsUploading(true)
    setUploadError("")
    
    const formData = new FormData()
    formData.append("file", file)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload/screenshot")
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded * 100) / event.total))
      }
    }
    xhr.onload = () => {
      setIsUploading(false)
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText)
        onChange(field.id, { url: res.data.url })
      } else {
        const res = JSON.parse(xhr.responseText)
        setUploadError(res.error || "Upload failed")
      }
    }
    xhr.onerror = () => {
      setIsUploading(false)
      setUploadError("Network error during upload")
    }
    xhr.send(formData)
  }

  const renderPassFail = () => {
    const isPass = answer?.value === "pass"
    const isFail = answer?.value === "fail"

    return (
      <div className="flex gap-4">
        <button
          disabled={disabled}
          onClick={() => onChange(field.id, "pass")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium border-2 transition-all ${
            isPass 
              ? "bg-green-500 border-green-500 text-white shadow-sm" 
              : "bg-white border-[#E2E8F0] text-gray-600 hover:border-green-200 hover:bg-green-50"
          } ${disabled && "opacity-60 cursor-not-allowed"}`}
        >
          <CheckCircle2 className="w-5 h-5" />
          Pass
        </button>
        <button
          disabled={disabled}
          onClick={() => onChange(field.id, "fail")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium border-2 transition-all ${
            isFail 
              ? "bg-red-500 border-red-500 text-white shadow-sm" 
              : "bg-white border-[#E2E8F0] text-gray-600 hover:border-red-200 hover:bg-red-50"
          } ${disabled && "opacity-60 cursor-not-allowed"}`}
        >
          <XCircle className="w-5 h-5" />
          Fail
        </button>
      </div>
    )
  }

  const renderText = () => {
    const textValue = answer?.value || ""
    return (
      <div>
        <textarea
          disabled={disabled}
          value={textValue}
          onChange={(e) => onChange(field.id, e.target.value)}
          rows={4}
          placeholder="Enter your notes here..."
          className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] disabled:bg-gray-50 disabled:text-gray-500 resize-none"
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-400">{textValue.length} chars</span>
        </div>
      </div>
    )
  }

  const renderScreenshot = () => {
    const screenshotUrl = answer?.value?.url

    if (screenshotUrl) {
      return (
        <div className="relative border border-[#E2E8F0] rounded-lg overflow-hidden bg-gray-50 group">
          <img src={screenshotUrl} alt="Screenshot" className="w-full max-h-48 object-contain" />
          {!disabled && (
            <button
              onClick={() => onChange(field.id, null)}
              className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove screenshot"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }

    return (
      <div>
        <div 
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' :
            isUploading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-[#0EA5E9] hover:bg-blue-50 cursor-pointer'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp"
            onChange={handleScreenshotUpload}
            disabled={disabled}
          />
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 mb-2 border-2 border-gray-200 border-t-[#0EA5E9] rounded-full animate-spin" />
              <p className="text-sm text-gray-600 font-medium">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">Click to upload screenshot</p>
            </div>
          )}
        </div>
        {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
      </div>
    )
  }

  const renderDropdown = () => {
    const choices = field.options?.choices || []
    return (
      <select
        disabled={disabled}
        value={answer?.value || ""}
        onChange={(e) => onChange(field.id, e.target.value)}
        className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] disabled:bg-gray-50 disabled:text-gray-500 bg-white"
      >
        <option value="" disabled>Select an option...</option>
        {choices.map((c: string, idx: number) => (
          <option key={idx} value={c}>{c}</option>
        ))}
      </select>
    )
  }

  const renderChecklist = () => {
    const steps = field.options?.steps || []
    const checkedState = answer?.value?.checked || Array(steps.length).fill(false)

    return (
      <div className="space-y-3">
        {steps.map((step: string, idx: number) => {
          const isChecked = checkedState[idx]
          return (
            <label key={idx} className={`flex items-start gap-3 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={isChecked}
                  onChange={(e) => {
                    const newChecked = [...checkedState]
                    newChecked[idx] = e.target.checked
                    onChange(field.id, { checked: newChecked })
                  }}
                  className="w-4 h-4 text-[#0EA5E9] border-gray-300 rounded focus:ring-[#0EA5E9]"
                />
              </div>
              <span className={`text-sm ${isChecked ? "line-through text-gray-400" : "text-gray-700"}`}>
                {step}
              </span>
            </label>
          )
        })}
      </div>
    )
  }

  const renderField = () => {
    switch (field.type) {
      case "PASS_FAIL": return renderPassFail()
      case "TEXT": return renderText()
      case "SCREENSHOT": return renderScreenshot()
      case "DROPDOWN": return renderDropdown()
      case "CHECKLIST": return renderChecklist()
      default: return <p className="text-sm text-red-500">Unknown field type: {field.type}</p>
    }
  }

  return (
    <div className="mb-8 last:mb-0">
      <div className="mb-3">
        <label className="block text-sm font-semibold text-gray-900 mb-1">{field.label}</label>
      </div>
      {renderField()}
    </div>
  )
}
