import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { updateFieldSchema } from "@/lib/validations"

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params
    const body = await req.json()
    const validation = updateFieldSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    const field = await db.testField.update({
      where: { id },
      data: {
        label: validation.data.label,
        type: validation.data.type,
        ...(validation.data.options !== undefined ? { 
          options: validation.data.options ? JSON.stringify(validation.data.options) : null 
        } : {})
      }
    })

    return NextResponse.json({ data: { ...field, options: field.options ? JSON.parse(field.options) : null } })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params
    await db.testField.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
