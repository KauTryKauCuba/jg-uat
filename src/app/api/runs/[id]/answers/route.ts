import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"

const saveAnswerSchema = z.object({
  testFieldId: z.string(),
  value: z.any()
})

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await props.params
    const body = await req.json()
    const validation = saveAnswerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
    }

    const { testFieldId, value } = validation.data

    // Check run ownership and status
    const run = await db.testRun.findUnique({ where: { id } })
    if (!run) {
      return NextResponse.json({ error: "Test run not found" }, { status: 404 })
    }

    if (session.user.role !== "ADMIN" && run.testerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (run.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot modify a submitted test run" }, { status: 400 })
    }

    // Upsert answer
    const stringifiedValue = value !== undefined && value !== null ? JSON.stringify(value) : null

    // We first try to find the existing one because Prisma upsert requires a unique identifier payload
    // and we have a composite unique constraint @@unique([testRunId, testFieldId]).
    // Prisma 5 supports compound unique in where:
    const answer = await db.testAnswer.upsert({
      where: {
        testRunId_testFieldId: {
          testRunId: id,
          testFieldId
        }
      },
      update: {
        value: stringifiedValue
      },
      create: {
        testRunId: id,
        testFieldId,
        value: stringifiedValue
      }
    })

    return NextResponse.json({ data: { answerId: answer.id } })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
