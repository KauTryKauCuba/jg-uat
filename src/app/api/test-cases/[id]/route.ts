import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { updateTestCaseSchema } from "@/lib/validations"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params

    const testCase = await db.testCase.findUnique({
      where: { id },
      include: {
        TestFields: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { TestRuns: true }
        }
      }
    })

    if (!testCase) {
      return NextResponse.json({ error: "Test case not found" }, { status: 404 })
    }

    return NextResponse.json({ data: testCase })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params
    const body = await req.json()
    const validation = updateTestCaseSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    const testCase = await db.testCase.update({
      where: { id },
      data: validation.data
    })

    return NextResponse.json({ data: testCase })
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

    await db.testCase.delete({
      where: { id }
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
