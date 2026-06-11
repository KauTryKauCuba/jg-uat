import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No PDF file found" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid file type. Only PDF is allowed." }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "pdfs")
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const uuid = uuidv4()
    const sanitized = file.name.replace(/[^a-zA-Z0-9.\-]/g, "") || "document.pdf"
    const fileName = `${uuid}-${sanitized}`
    const filePath = path.join(uploadDir, fileName)

    // Convert Web File to Node Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Write file to disk
    fs.writeFileSync(filePath, buffer)

    return NextResponse.json({ data: { url: `/uploads/pdfs/${fileName}` } })

  } catch (error) {
    console.error("PDF upload error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
