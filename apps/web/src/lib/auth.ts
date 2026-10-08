import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import redis from '@/lib/redis';
import { accountStateSelect, isAccountUsable } from '@/lib/policies/account';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? (() => { throw new Error('NEXTAUTH_SECRET is required'); })(),
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

          // Rate Limiting Policy: 10 failed attempts per 15 minutes per email
          const rateLimitKey = `rl:login:${email}`;
          if (redis.isReady) {
            try {
              const attempts = await redis.get(rateLimitKey);
              if (attempts && parseInt(attempts, 10) >= 10) {
                throw new Error('Too many login attempts. Please try again later.');
              }
            } catch (err) {
              console.warn('Redis rate limit read error', err);
            }
          }

          const user = await prisma.user.findUnique({
            where: { email },
            include: { employee: { select: { status: true } } },
          });

          // Dummy hash matching "password" generated to take ~same time as a real hash
          const DUMMY_HASH = '$2a$10$5tReOFvOf3Tr81yXrmVlteVYa1HvSTgZ89nvVzJF6OJAilimB49eW';
          
          const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
          const isPasswordValid = await bcrypt.compare(credentials.password, hashToCompare);

          if (!user || !isPasswordValid) {
            if (redis.isReady) {
              try {
                await redis.incr(rateLimitKey);
                // Set expiry only on first increment (15 minutes)
                const currentAttempts = await redis.get(rateLimitKey);
                if (currentAttempts === '1') {
                  await redis.expire(rateLimitKey, 15 * 60);
                }
              } catch (err) {
                console.warn('Redis rate limit write error', err);
              }
            }
            throw new Error('Invalid email or password.');
          }

          if (!isAccountUsable(user)) {
            throw new Error('Invalid email or password.');
          }

          // Reset rate limit on successful login
          if (redis.isReady) {
            try {
              await redis.del(rateLimitKey);
            } catch (err) {}
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            sessionVersion: user.sessionVersion,
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
        token.sessionVersion = (user as any).sessionVersion;
      }
      
      // AUTH-08 & AUTH-09: Re-verify against database on every token decode
      if (token?.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, sessionVersion: true, ...accountStateSelect }
        });
        
        if (!freshUser || !isAccountUsable(freshUser) || freshUser.sessionVersion !== token.sessionVersion) {
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
  events: {
    async signOut({ token }) {
      if (token?.id) {
        try {
          await prisma.user.update({
            where: { id: token.id as string },
            data: { sessionVersion: { increment: 1 } }
          });
        } catch(e) {}
      }
    }
  },
  pages: {
    signIn: '/login',
  },
};

