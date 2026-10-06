const fs = require('fs');

const ventureRoutePath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\ventures\\[ventureId]\\route.ts';
let vContent = fs.readFileSync(ventureRoutePath, 'utf-8');

// Fix GET
const getReplacement = `    const user = await requireAuth();
    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    try {
      const venture = await prisma.venture.findFirst({
        where: {
          AND: [
            { OR: [{ id: ventureId }, { code: ventureId }] },
            scopedWhere
          ]
        },`;
vContent = vContent.replace(/    try \{\s*const venture = await prisma\.venture\.findFirst\(\{\s*where: \{\s*OR: \[\{ id: ventureId \}, \{ code: ventureId \}\],\s*\},/, getReplacement);

// Fix PATCH
const patchReplacement = `    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    // Ensure they have access to THIS venture
    const existingVenture = await prisma.venture.findFirst({
      where: { AND: [{ id: ventureId }, scopedWhere] }
    });
    if (!existingVenture) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });

    try {
      const updated = await prisma.venture.update({`;
vContent = vContent.replace(/    try \{\s*const updated = await prisma\.venture\.update\(\{/, patchReplacement);

// Fix DELETE
const deleteReplacement = `    const { buildScopedWhere } = await import('@/lib/authorization');
    const scopedWhere = await buildScopedWhere(user, 'venture');
    if (scopedWhere.id === 'DENY_ALL') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const existingVenture = await prisma.venture.findFirst({
      where: { AND: [{ id: ventureId }, scopedWhere] }
    });
    if (!existingVenture) return NextResponse.json({ success: false, error: 'Forbidden: Out of Scope' }, { status: 403 });

    // Delete the venture
    await prisma.venture.delete({`;
vContent = vContent.replace(/    \/\/ Delete the venture\s*await prisma\.venture\.delete\(\{/, deleteReplacement);

fs.writeFileSync(ventureRoutePath, vContent, 'utf-8');
console.log('Fixed venture IDORs');

// Now fix Materials silently creating categories
const materialRoutePath = 'e:\\Builder_mang\\apps\\web\\src\\app\\api\\materials\\route.ts';
let mContent = fs.readFileSync(materialRoutePath, 'utf-8');

const matReplacement = `    // 1. Resolve Category
    let category = await prisma.materialCategory.findFirst({
      where: { name: { equals: categoryName, mode: 'insensitive' } }
    });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found. Explicit catalog creation required.' }, { status: 400 });
    }

    // 2. Resolve Unit of Measure (UOM)
    let uom = await prisma.unitOfMeasure.findFirst({
      where: { name: { equals: uomName, mode: 'insensitive' } }
    });
    if (!uom) {
      return NextResponse.json({ success: false, error: 'Unit of Measure not found. Explicit catalog creation required.' }, { status: 400 });
    }`;
    
mContent = mContent.replace(/    \/\/ 1\. Resolve or create Category[\s\S]*?if \(!uom\) \{[\s\S]*?uom = await prisma\.unitOfMeasure\.create\(\{[\s\S]*?data: \{ name: uomName \}[\s\S]*?\}\);[\s\S]*?\}/, matReplacement);

fs.writeFileSync(materialRoutePath, mContent, 'utf-8');
console.log('Fixed Material silent creation');
