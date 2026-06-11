import { TestCase, TestField, FieldType, RunStatus } from "@prisma/client"

export { FieldType, RunStatus }

export type TestCaseWithCounts = TestCase & {
  _count: {
    TestFields: number
    TestRuns: number
  }
}

export type TestFieldWithOptions = TestField & {
  options: any
}

export type TestCaseWithFields = TestCase & {
  TestFields: TestFieldWithOptions[]
  _count: {
    TestRuns: number
  }
}
