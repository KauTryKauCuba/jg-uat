import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { createFieldSchema } from "@/lib/validations"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params

    const fields = await db.testField.findMany({
      where: { testCaseId: id },
      orderBy: { order: 'asc' }
    })
    
    // Parse JSON options back
    const mappedFields = fields.map(f => ({
      ...f,
      options: f.options ? JSON.parse(f.options) : null
    }))
    
    return NextResponse.json({ data: mappedFields })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params
    const body = await req.json()
    const validation = createFieldSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    let order = validation.data.order
    if (order === undefined) {
      const maxField = await db.testField.findFirst({
        where: { testCaseId: id },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      order = maxField ? maxField.order + 1 : 0
    }

    const field = await db.testField.create({
      data: {
        testCaseId: id,
        label: validation.data.label,
        type: validation.data.type,
        options: validation.data.options ? JSON.stringify(validation.data.options) : null,
        order
      }
    })

    return NextResponse.json({ data: { ...field, options: field.options ? JSON.parse(field.options) : null } }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
