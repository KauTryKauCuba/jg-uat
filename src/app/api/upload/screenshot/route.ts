import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import formidable from "formidable"
import { v4 as uuidv4 } from "uuid"
import { Readable } from "stream"
import path from "path"
import fs from "fs"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!req.body) {
      return NextResponse.json({ error: "No body provided" }, { status: 400 })
    }

    // Convert Web stream to Node stream for formidable
    const nodeReq = Readable.fromWeb(req.body as any) as any
    nodeReq.headers = Object.fromEntries(req.headers.entries())
    nodeReq.method = req.method

    const uploadDir = path.join(process.cwd(), "public", "uploads", "screenshots")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filter: (part) => {
        return part.mimetype === "image/png" || part.mimetype === "image/jpeg" || part.mimetype === "image/webp"
      },
      filename: (name, ext, part) => {
        const uuid = uuidv4()
        const sanitized = part.originalFilename?.replace(/[^a-zA-Z0-9.\-]/g, "") || "screenshot.png"
        return `${uuid}-${sanitized}`
      }
    })

    return new Promise<NextResponse>((resolve) => {
      form.parse(nodeReq, (err, fields, files) => {
        if (err) {
          return resolve(NextResponse.json({ error: "Upload failed: " + err.message }, { status: 500 }))
        }
        
        // Formidable v3 puts files in an array
        const fileArray = files.file || files.image || files.screenshot
        const uploadedFile = Array.isArray(fileArray) ? fileArray[0] : fileArray
        
        if (!uploadedFile) {
          return resolve(NextResponse.json({ error: "No image file found or invalid format" }, { status: 400 }))
        }

        resolve(NextResponse.json({ data: { url: `/uploads/screenshots/${uploadedFile.newFilename}` } }))
      })
    })

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
