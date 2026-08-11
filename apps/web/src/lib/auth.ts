import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const MOCK_TEST_USERS = [
  {
    id: 'usr_admin_01',
    name: 'Admin User',
    email: 'admin@builder.com',
    password: 'password123',
    role: 'ADMIN',
  },
  {
    id: 'usr_pm_01',
    name: 'Project Manager User',
    email: 'pm@builder.com',
    password: 'password123',
    role: 'PROJECT_MANAGER',
  },
  {
    id: 'usr_engineer_01',
    name: 'Site Engineer User',
    email: 'engineer@builder.com',
    password: 'password123',
    role: 'SITE_ENGINEER',
  },
  {
    id: 'usr_store_01',
    name: 'Store Manager User',
    email: 'store@builder.com',
    password: 'password123',
    role: 'STORE_MANAGER',
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Test Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const matchedUser = MOCK_TEST_USERS.find(
          (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
        );
        if (matchedUser) {
          return {
            id: matchedUser.id,
            name: matchedUser.name,
            email: matchedUser.email,
            role: matchedUser.role,
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
