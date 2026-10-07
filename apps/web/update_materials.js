const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'api', 'materials', 'route.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newPost = `export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'ADMIN' && !hasPermission(userRole, 'materials:manage'))) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin or Project Manager access required' }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch(e) {
      return NextResponse.json({ success: false, error: 'Malformed JSON' }, { status: 400 });
    }
    const { name, code, categoryName, uomName, reorderLevel } = body;

    const cleanName = (name || '').trim().replace(/\\s+/g, ' ');
    if (!cleanName) {
      return NextResponse.json({ success: false, error: 'Material name is required.' }, { status: 400 });
    }

    const cleanCode = (code || '').trim().replace(/\\s+/g, ' ');
    if (!cleanCode) {
      return NextResponse.json({ success: false, error: 'Material code is required.' }, { status: 400 });
    }

    const rLevel = parseFloat(reorderLevel);
    if (reorderLevel !== undefined && (isNaN(rLevel) || !isFinite(rLevel) || rLevel < 0)) {
      return NextResponse.json({ success: false, error: 'Invalid reorderLevel: must be a positive finite number.' }, { status: 400 });
    }

    const cleanCategory = (categoryName || '').trim().replace(/\\s+/g, ' ').toUpperCase();
    if (!cleanCategory) {
      return NextResponse.json({ success: false, error: 'Category name is required.' }, { status: 400 });
    }

    const cleanUom = (uomName || '').trim().replace(/\\s+/g, ' ').toUpperCase();
    if (!cleanUom) {
      return NextResponse.json({ success: false, error: 'Unit of measure name is required.' }, { status: 400 });
    }

    // Upsert Category
    const category = await prisma.materialCategory.upsert({
      where: { name: cleanCategory },
      update: {},
      create: { name: cleanCategory }
    });

    // Upsert UOM
    const uom = await prisma.unitOfMeasure.upsert({
      where: { name: cleanUom },
      update: {},
      create: { name: cleanUom }
    });

    try {
      const material = await prisma.material.create({
        data: {
          name: cleanName,
          code: cleanCode,
          categoryId: category.id,
          baseUnitId: uom.id,
          reorderLevel: isNaN(rLevel) ? 0 : rLevel,
          status: 'ACTIVE',
          createdById: (session.user as any).id
        },
        include: {
          category: true,
          unitOfMeasure: true
        }
      });
      return NextResponse.json({ success: true, data: material }, { status: 201 });
    } catch (dbError: any) {
      if (dbError.code === 'P2002') {
        return NextResponse.json({ success: false, error: 'Material code must be unique' }, { status: 409 });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Failed to create material:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`;

const lines = content.split('\n');
const postIndex = lines.findIndex(l => l.startsWith('export async function POST'));
if (postIndex !== -1) {
  content = lines.slice(0, postIndex).join('\n') + '\n' + newPost;
}
fs.writeFileSync(filePath, content);
console.log('Done!');
