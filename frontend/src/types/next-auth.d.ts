// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name?: string
    profile?: {
      id: string
      first_name?: string
      last_name?: string
      address?: string
      additional_info?: string
      face_image?: string
      thumb_image?: string
    }
  }

  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}