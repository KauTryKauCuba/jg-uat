import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as 'ADMIN' | 'TESTER'
        session.user.id = token.sub as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
