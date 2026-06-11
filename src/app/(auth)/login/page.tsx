"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Loader2 } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
})

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const validation = loginSchema.safeParse({ email, password })
    if (!validation.success) {
      setError(validation.error.issues[0].message)
      setIsLoading(false)
      return
    }

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        setError("Invalid email or password.")
      } else {
        router.refresh() // Refresh to allow middleware to handle redirect based on role
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-full max-w-md p-8 space-y-6 bg-[#FFFFFF] rounded-lg shadow-md border border-[#E2E8F0]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1E3A5F]">JobGiga UAT</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-2 border border-[#E2E8F0] rounded-md shadow-sm focus:ring-[#0EA5E9] focus:border-[#0EA5E9] outline-none transition-colors duration-150 ease-in-out"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-4 py-2 border border-[#E2E8F0] rounded-md shadow-sm focus:ring-[#0EA5E9] focus:border-[#0EA5E9] outline-none transition-colors duration-150 ease-in-out"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-[#EF4444] bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1E3A5F] hover:bg-[#152e4d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
