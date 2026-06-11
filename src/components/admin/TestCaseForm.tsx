"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2, Plus, UploadCloud, X } from "lucide-react"
import { ConfirmModal } from "@/components/shared/ConfirmModal"

type FieldOption = any

type FieldState = {
  id: string
  label: string
  type: string
  options?: FieldOption
  isNew?: boolean
  isDeleted?: boolean
  isModified?: boolean
}

interface TestCaseFormProps {
  initialData?: {
    id: string
    title: string
    description?: string | null
    pdfPath?: string | null
    TestFields: any[]
  }
}

function SortableFieldItem({ 
  field, 
  onEdit, 
  onDelete 
}: { 
  field: FieldState; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 bg-white border border-[#E2E8F0] rounded-md shadow-sm mb-2 group">
      <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{field.label}</p>
        <span className="inline-block mt-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-medium">
          {field.type}
        </span>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} type="button" className="p-1.5 text-gray-400 hover:text-[#0EA5E9] rounded-md hover:bg-blue-50">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete} type="button" className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function TestCaseForm({ initialData }: TestCaseFormProps) {
  const router = useRouter()
  const isEditing = !!initialData

  // Section 1: Basic Info
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")

  // Section 2: PDF Upload
  const [pdfPath, setPdfPath] = useState(initialData?.pdfPath || "")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Section 3: Fields
  const [fields, setFields] = useState<FieldState[]>(
    (initialData?.TestFields || []).map(f => ({ ...f, isNew: false, isModified: false, isDeleted: false }))
  )
  const [activeFields, setActiveFields] = useState<FieldState[]>(fields.filter(f => !f.isDeleted))
  
  const [isAddingField, setIsAddingField] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  
  // Field inline form state
  const [fieldLabel, setFieldLabel] = useState("")
  const [fieldType, setFieldType] = useState("TEXT")
  const [fieldChoices, setFieldChoices] = useState<string[]>(["", ""])
  const [fieldSteps, setFieldSteps] = useState<string[]>([""])

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Update active fields whenever fields state changes
  const updateActiveFields = (newFields: FieldState[]) => {
    setFields(newFields)
    setActiveFields(newFields.filter(f => !f.isDeleted))
  }

  // File Upload Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed")
      return
    }

    setIsUploading(true)
    setError("")
    
    const formData = new FormData()
    formData.append("file", file)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload/pdf")
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded * 100) / event.total))
      }
    }
    xhr.onload = () => {
      setIsUploading(false)
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText)
        setPdfPath(res.data.url)
      } else {
        const res = JSON.parse(xhr.responseText)
        setError(res.error || "Upload failed")
      }
    }
    xhr.onerror = () => {
      setIsUploading(false)
      setError("Network error during upload")
    }
    xhr.send(formData)
  }

  // DND Handlers
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = activeFields.findIndex(i => i.id === active.id)
      const newIndex = activeFields.findIndex(i => i.id === over.id)
      
      const newActiveFields = arrayMove(activeFields, oldIndex, newIndex)
      
      // Update main fields array to reflect new order for active ones
      const newFields = [...fields]
      // Replace all active ones with the new sorted active ones
      let activeIdx = 0
      for (let i = 0; i < newFields.length; i++) {
        if (!newFields[i].isDeleted) {
          newFields[i] = newActiveFields[activeIdx]
          activeIdx++
        }
      }
      updateActiveFields(newFields)
    }
  }

  // Field Form Handlers
  const resetFieldForm = () => {
    setFieldLabel("")
    setFieldType("TEXT")
    setFieldChoices(["", ""])
    setFieldSteps([""])
    setIsAddingField(false)
    setEditingFieldId(null)
  }

  const openEditField = (field: FieldState) => {
    setFieldLabel(field.label)
    setFieldType(field.type)
    if (field.type === "DROPDOWN") {
      setFieldChoices(field.options?.choices || ["", ""])
    } else if (field.type === "CHECKLIST") {
      setFieldSteps(field.options?.steps || [""])
    }
    setEditingFieldId(field.id)
    setIsAddingField(true)
  }

  const saveField = () => {
    if (!fieldLabel.trim()) {
      alert("Label is required")
      return
    }

    let options = undefined
    if (fieldType === "DROPDOWN") {
      const validChoices = fieldChoices.filter(c => c.trim() !== "")
      if (validChoices.length < 2) {
        alert("Dropdown needs at least 2 choices")
        return
      }
      options = { choices: validChoices }
    } else if (fieldType === "CHECKLIST") {
      const validSteps = fieldSteps.filter(s => s.trim() !== "")
      if (validSteps.length < 1) {
        alert("Checklist needs at least 1 step")
        return
      }
      options = { steps: validSteps }
    }

    if (editingFieldId) {
      updateActiveFields(fields.map(f => f.id === editingFieldId ? { 
        ...f, 
        label: fieldLabel, 
        type: fieldType, 
        options,
        isModified: !f.isNew 
      } : f))
    } else {
      const newField: FieldState = {
        id: "temp-" + Date.now(),
        label: fieldLabel,
        type: fieldType,
        options,
        isNew: true
      }
      updateActiveFields([...fields, newField])
    }
    resetFieldForm()
  }

  const confirmDeleteField = () => {
    if (fieldToDelete) {
      updateActiveFields(fields.map(f => f.id === fieldToDelete ? { ...f, isDeleted: true } : f))
    }
    setDeleteModalOpen(false)
    setFieldToDelete(null)
  }

  // Main Save
  const handleSaveTestCase = async () => {
    if (!title.trim()) {
      setError("Title is required")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      let testCaseId = initialData?.id

      if (!isEditing) {
        // Create Test Case
        const tcRes = await fetch("/api/test-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, pdfPath })
        })
        const tcData = await tcRes.json()
        if (!tcRes.ok) throw new Error(tcData.error)
        testCaseId = tcData.data.id

        // Create Fields
        for (let i = 0; i < activeFields.length; i++) {
          const field = activeFields[i]
          await fetch(`/api/test-cases/${testCaseId}/fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: field.label,
              type: field.type,
              options: field.options,
              order: i
            })
          })
        }
      } else {
        // Edit Test Case
        const tcRes = await fetch(`/api/test-cases/${testCaseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, pdfPath })
        })
        if (!tcRes.ok) throw new Error("Failed to update test case")

        // Sync Fields
        const newOrderedFields = []
        for (let i = 0; i < fields.length; i++) {
          const field = fields[i]
          
          if (field.isDeleted && !field.isNew) {
            await fetch(`/api/fields/${field.id}`, { method: "DELETE" })
          } else if (field.isNew && !field.isDeleted) {
            const fRes = await fetch(`/api/test-cases/${testCaseId}/fields`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ label: field.label, type: field.type, options: field.options, order: 0 }) // order handled later
            })
            const fData = await fRes.json()
            newOrderedFields.push({ id: fData.data.id, order: activeFields.findIndex(af => af.id === field.id) })
          } else if (field.isModified && !field.isDeleted) {
            await fetch(`/api/fields/${field.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ label: field.label, type: field.type, options: field.options })
            })
            newOrderedFields.push({ id: field.id, order: activeFields.findIndex(af => af.id === field.id) })
          } else if (!field.isDeleted) {
            newOrderedFields.push({ id: field.id, order: activeFields.findIndex(af => af.id === field.id) })
          }
        }

        // Reorder
        if (newOrderedFields.length > 0) {
          await fetch(`/api/test-cases/${testCaseId}/fields/reorder`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newOrderedFields.sort((a,b) => a.order - b.order).map((f, idx) => ({ id: f.id, order: idx })))
          })
        }
      }

      router.push("/admin/test-cases")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to save test case")
      setIsSaving(false)
    }
  }

  const isSaveDisabled = !title.trim() || isSaving

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Section 1: Basic Info */}
      <section className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-sm">
        <h3 className="text-lg font-semibold text-[#1E3A5F] mb-4">1. Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              placeholder="e.g., Onboarding Flow Validation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              placeholder="Brief description of the test scenario..."
            />
          </div>
        </div>
      </section>

      {/* Section 2: PDF Upload */}
      <section className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-sm">
        <h3 className="text-lg font-semibold text-[#1E3A5F] mb-4">2. Reference Document (PDF)</h3>
        
        {pdfPath ? (
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-md">PDF</div>
              <span className="text-sm font-medium text-gray-700 truncate max-w-md">{pdfPath.split('/').pop()}</span>
            </div>
            <button
              onClick={() => setPdfPath("")}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        ) : (
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isUploading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-[#0EA5E9] hover:bg-blue-50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="application/pdf"
              onChange={handleFileChange}
            />
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 mb-4 border-4 border-gray-200 border-t-[#0EA5E9] rounded-full animate-spin" />
                <p className="text-sm text-gray-600 font-medium">Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700">Click or drag PDF to upload</p>
                <p className="text-xs text-gray-500 mt-1">Maximum file size 20MB</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section 3: Field Builder */}
      <section className="bg-white p-6 rounded-lg border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1E3A5F]">3. Test Fields</h3>
        </div>

        {activeFields.length > 0 && (
          <div className="mb-6">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={activeFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                {activeFields.map(field => (
                  <SortableFieldItem 
                    key={field.id} 
                    field={field} 
                    onEdit={() => openEditField(field)}
                    onDelete={() => {
                      setFieldToDelete(field.id)
                      setDeleteModalOpen(true)
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        {isAddingField ? (
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800">{editingFieldId ? "Edit Field" : "Add New Field"}</h4>
              <button onClick={resetFieldForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Label *</label>
                <input
                  type="text"
                  value={fieldLabel}
                  onChange={e => setFieldLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                <select
                  value={fieldType}
                  onChange={e => setFieldType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white"
                >
                  <option value="TEXT">Text</option>
                  <option value="PASS_FAIL">Pass / Fail</option>
                  <option value="SCREENSHOT">Screenshot</option>
                  <option value="DROPDOWN">Dropdown</option>
                  <option value="CHECKLIST">Checklist</option>
                </select>
              </div>

              {fieldType === "DROPDOWN" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dropdown Choices</label>
                  {fieldChoices.map((choice, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={choice}
                        onChange={e => {
                          const newChoices = [...fieldChoices]
                          newChoices[idx] = e.target.value
                          setFieldChoices(newChoices)
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] text-sm"
                        placeholder={`Choice ${idx + 1}`}
                      />
                      <button 
                        onClick={() => setFieldChoices(fieldChoices.filter((_, i) => i !== idx))}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setFieldChoices([...fieldChoices, ""])} className="text-sm text-[#0EA5E9] font-medium hover:underline mt-1">+ Add Choice</button>
                </div>
              )}

              {fieldType === "CHECKLIST" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Steps</label>
                  {fieldSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={step}
                        onChange={e => {
                          const newSteps = [...fieldSteps]
                          newSteps[idx] = e.target.value
                          setFieldSteps(newSteps)
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] text-sm"
                        placeholder={`Step ${idx + 1}`}
                      />
                      <button 
                        onClick={() => setFieldSteps(fieldSteps.filter((_, i) => i !== idx))}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setFieldSteps([...fieldSteps, ""])} className="text-sm text-[#0EA5E9] font-medium hover:underline mt-1">+ Add Step</button>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={resetFieldForm} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button onClick={saveField} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800">Save Field</button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAddingField(true)}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-[#0EA5E9] hover:border-[#0EA5E9] hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Field
          </button>
        )}
      </section>

      {/* Footer Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <button 
          onClick={() => router.push('/admin/test-cases')}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button 
          onClick={handleSaveTestCase}
          disabled={isSaveDisabled}
          className="px-6 py-2.5 text-sm font-medium text-white bg-[#0EA5E9] rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {isEditing ? "Save Changes" : "Create Test Case"}
        </button>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Field"
        message="Are you sure you want to remove this field? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteField}
        onCancel={() => {
          setDeleteModalOpen(false)
          setFieldToDelete(null)
        }}
        variant="danger"
      />
    </div>
  )
}
