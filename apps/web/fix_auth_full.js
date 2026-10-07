const fs = require('fs');
const p = 'e:\\Builder_mang\\apps\\web\\src\\lib\\auth.ts';
let c = fs.readFileSync(p, 'utf8');

if (!c.includes('sessionVersion: (user as any).sessionVersion,')) {
  c = c.replace(
    /role: user\.role,\s*\};\s*\} catch \(error: any\)/,
    `role: user.role,\n            sessionVersion: (user as any).sessionVersion,\n          };\n        } catch (error: any)`
  );
}

if (!c.includes('token.sessionVersion = (user as any).sessionVersion;')) {
  c = c.replace(
    /token\.id = user\.id;\s*\}/,
    `token.id = user.id;\n        token.sessionVersion = (user as any).sessionVersion;\n      }`
  );
}

if (!c.includes('select: { role: true, isActive: true, sessionVersion: true }')) {
  c = c.replace(
    /select: \{ role: true, isActive: true \}/,
    `select: { role: true, isActive: true, sessionVersion: true }`
  );
}

if (!c.includes('!freshUser.isActive || freshUser.sessionVersion !== token.sessionVersion')) {
  c = c.replace(
    /if \(\!freshUser \|\| \!freshUser\.isActive\) \{/,
    `if (!freshUser || !freshUser.isActive || freshUser.sessionVersion !== token.sessionVersion) {`
  );
}

if (!c.includes('events: {')) {
  c = c.replace(
    /pages: \{/,
    `events: {\n    async signOut({ token }) {\n      if (token?.id) {\n        try {\n          await prisma.user.update({\n            where: { id: token.id as string },\n            data: { sessionVersion: { increment: 1 } }\n          });\n        } catch(e) {}\n      }\n    }\n  },\n  pages: {`
  );
}

fs.writeFileSync(p, c, 'utf8');
console.log('Modified auth.ts fully');
