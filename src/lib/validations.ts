import { z } from "zod"

export const createTestCaseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  pdfPath: z.string().optional().nullable(),
})

export const updateTestCaseSchema = createTestCaseSchema

export const createFieldSchema = z.object({
  label: z.string().min(1, "Label is required"),
  type: z.enum(["PASS_FAIL", "TEXT", "SCREENSHOT", "DROPDOWN", "CHECKLIST"]),
  options: z.record(z.string(), z.any()).optional().nullable(),
  order: z.number().int().optional(),
}).refine(data => {
  if (data.type === "DROPDOWN") {
    if (!data.options || !Array.isArray(data.options.choices) || data.options.choices.length < 2) {
      return false
    }
  }
  if (data.type === "CHECKLIST") {
    if (!data.options || !Array.isArray(data.options.steps) || data.options.steps.length < 1) {
      return false
    }
  }
  return true
}, {
  message: "Invalid options for the selected field type",
  path: ["options"]
})

export const updateFieldSchema = z.object({
  label: z.string().min(1, "Label is required").optional(),
  type: z.enum(["PASS_FAIL", "TEXT", "SCREENSHOT", "DROPDOWN", "CHECKLIST"]).optional(),
  options: z.record(z.string(), z.any()).optional().nullable(),
}).refine(data => {
  if (data.type === "DROPDOWN") {
    if (!data.options || !Array.isArray(data.options.choices) || data.options.choices.length < 2) {
      return false
    }
  }
  if (data.type === "CHECKLIST") {
    if (!data.options || !Array.isArray(data.options.steps) || data.options.steps.length < 1) {
      return false
    }
  }
  return true
}, {
  message: "Invalid options for the selected field type",
  path: ["options"]
})

export const reorderFieldsSchema = z.array(z.object({
  id: z.string(),
  order: z.number().int()
}))
