import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials || typeof credentials.email !== 'string' || typeof credentials.password !== 'string') {
            throw new Error('Invalid email or password.');
          }

          // AUTH-07: Prevent bcrypt resource exhaustion by enforcing maximum 72 bytes
          if (Buffer.byteLength(credentials.password, 'utf8') > 72) {
            throw new Error('Invalid email or password.');
          }

          const email = credentials.email.toLowerCase().trim();
          if (!email) {
            throw new Error('Invalid email or password.');
          }

          const user = await prisma.user.findUnique({
            where: { email },
          });

          // Dummy hash matching "password" generated to take ~same time as a real hash
          const DUMMY_HASH = '$2a$10$5tReOFvOf3Tr81yXrmVlteVYa1HvSTgZ89nvVzJF6OJAilimB49eW';
          
          const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
          const isPasswordValid = await bcrypt.compare(credentials.password, hashToCompare);

          if (!user || !isPasswordValid) {
            throw new Error('Invalid email or password.');
          }

          if (!user.isActive) {
            // Account is inactive, but we don't leak this externally
            throw new Error('Invalid email or password.');
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error: any) {
          // Log real errors internally for auditing (could use a real logger here)
          console.error('[AUTH_ERROR]', error.message);
          // Always throw a generic error to the client
          throw new Error('Invalid email or password.');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      
      // AUTH-08 & AUTH-09: Re-verify against database on every token decode
      if (token?.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isActive: true }
        });
        
        if (!freshUser || !freshUser.isActive) {
          // Invalidate token
          return {};
        }
        
        // Sync role
        token.role = freshUser.role;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (Object.keys(token).length === 0) {
         // Empty token due to deactivation
         return { ...session, user: undefined as any };
      }
      if (session.user && token.id) {
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

