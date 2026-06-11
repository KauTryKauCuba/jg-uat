import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { reorderFieldsSchema } from "@/lib/validations"

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params // testCaseId
    const body = await req.json()
    const validation = reorderFieldsSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    // Verify all fields belong to this test case
    const fieldIds = validation.data.map(f => f.id)
    const existingFields = await db.testField.count({
      where: {
        id: { in: fieldIds },
        testCaseId: id
      }
    })

    if (existingFields !== fieldIds.length) {
      return NextResponse.json({ error: "Some fields do not belong to this test case" }, { status: 400 })
    }

    // Prisma transaction
    await db.$transaction(
      validation.data.map(item => 
        db.testField.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    )

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
