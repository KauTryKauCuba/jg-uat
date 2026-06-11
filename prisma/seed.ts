import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const saltRounds = 12

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', saltRounds)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jobgiga.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@jobgiga.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create Tester
  const testerPassword = await bcrypt.hash('tester123', saltRounds)
  const tester = await prisma.user.upsert({
    where: { email: 'tester@jobgiga.com' },
    update: {},
    create: {
      name: 'Tester User',
      email: 'tester@jobgiga.com',
      password: testerPassword,
      role: 'TESTER',
    },
  })

  console.log({ admin, tester })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
