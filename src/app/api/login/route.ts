import { getServerSession, type DefaultSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { Login } from "../login";
import { UserRepositoryMemory } from "/login/UserRepositoryMemory";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }


  const handler: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
    },
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email", placeholder: "email@example.com" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials.password) {
            throw new Error("Email e senha são obrigatórios.");
          }

          const user = await sessionStorage.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error("Usuário não encontrado.");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            throw new Error("Senha incorreta.");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        },
      }),
    ],
    pages: {
      signIn: "/login",
    },
  };

  export { handler as GET, handler as POST };
