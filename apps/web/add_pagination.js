const fs = require('fs');
const path = require('path');

const files = [
  'apps/web/src/app/api/ventures/route.ts',
  'apps/web/src/app/api/leaves/route.ts',
  'apps/web/src/app/api/attendance/route.ts',
  'apps/web/src/app/api/materials/route.ts',
  'apps/web/src/app/api/chat/rooms/route.ts',
  'apps/web/src/app/api/chat/rooms/[roomId]/messages/route.ts'
];

for (const relPath of files) {
  const filePath = path.join('e:\\Builder_mang', relPath);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('getPaginationParams')) {
    content = content.replace(/(import .*;\r?\n)+/, `$&import { getPaginationParams } from '@/lib/pagination';\n`);
  }
  
  if (relPath.includes('ventures/route.ts')) {
    content = content.replace(/const ventures = await prisma\.venture\.findMany\(\{\s+where: whereClause,/,
      `const { skip, take } = getPaginationParams(request);\n      const ventures = await prisma.venture.findMany({\n        where: whereClause,\n        skip,\n        take,`);
  } else if (relPath.includes('leaves/route.ts')) {
    content = content.replace(/const records = await prisma\.leaveRequest\.findMany\(\{\s+where/,
      `const { skip, take } = getPaginationParams(req);\n    const records = await prisma.leaveRequest.findMany({\n      where`);
    content = content.replace(/where: \{ AND: \[where, scopedWhere\] \},/, `where: { AND: [where, scopedWhere] },\n      skip,\n      take,`);
  } else if (relPath.includes('attendance/route.ts')) {
    content = content.replace(/const records = await prisma\.attendance\.findMany\(\{\s+where/,
      `const { skip, take } = getPaginationParams(req);\n    const records = await prisma.attendance.findMany({\n      where`);
    content = content.replace(/where: \{ AND: \[where, scopedWhere\] \},/, `where: { AND: [where, scopedWhere] },\n      skip,\n      take,`);
  } else if (relPath.includes('materials/route.ts')) {
    content = content.replace(/const materials = await prisma\.material\.findMany\(\{/,
      `const { skip, take } = getPaginationParams(req);\n    const materials = await prisma.material.findMany({\n      skip,\n      take,`);
  } else if (relPath.includes('chat/rooms/route.ts')) {
    content = content.replace(/const rooms = await prisma\.chatRoom\.findMany\(\{/,
      `const { skip, take } = getPaginationParams(req);\n    const rooms = await prisma.chatRoom.findMany({\n      skip,\n      take,`);
  } else if (relPath.includes('chat/rooms/[roomId]/messages/route.ts')) {
    content = content.replace(/const messages = await prisma\.chatMessage\.findMany\(\{/,
      `const { skip, take } = getPaginationParams(req);\n    const messages = await prisma.chatMessage.findMany({\n      skip,\n      take,`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', relPath);
}
