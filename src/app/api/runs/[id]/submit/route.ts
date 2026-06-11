import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params

    const run = await db.testRun.findUnique({ where: { id } })
    if (!run) {
      return NextResponse.json({ error: "Test run not found" }, { status: 404 })
    }

    if (session.user.role !== "ADMIN" && run.testerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (run.status === "COMPLETED") {
      return NextResponse.json({ error: "Run is already submitted" }, { status: 400 })
    }

    const updatedRun = await db.testRun.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date()
      }
    })

    return NextResponse.json({ 
      data: { 
        runId: updatedRun.id, 
        status: updatedRun.status, 
        completedAt: updatedRun.completedAt 
      } 
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
