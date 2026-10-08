/**
 * One-time backfill: stock rows created outside the ledger (e.g. by older seeds) don't reconcile
 * with SUM(quantityIn) - SUM(quantityOut). For each MaterialStock row with a gap, insert an
 * OPENING_BALANCE transaction for the missing quantity, dated before every existing ledger row.
 *
 * Dry run (default):  npx tsx src/prisma/backfill-opening-balance.ts
 * Apply:              npx tsx src/prisma/backfill-opening-balance.ts --apply
 */
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
  if (!admin) throw new Error('No ADMIN user found to attribute the backfill to');

  const stocks = await prisma.materialStock.findMany({ include: { material: { select: { name: true } } } });
  let gaps = 0;

  for (const stock of stocks) {
    const where = { materialId: stock.materialId, stockLocationId: stock.stockLocationId };
    const [sums, first] = await Promise.all([
      prisma.materialTransaction.aggregate({ where, _sum: { quantityIn: true, quantityOut: true } }),
      prisma.materialTransaction.findFirst({ where, orderBy: { createdAt: 'asc' } }),
    ]);
    const ledgerNet = new Prisma.Decimal(sums._sum.quantityIn ?? 0).minus(sums._sum.quantityOut ?? 0);
    const gap = stock.physicalQuantity.minus(ledgerNet);
    if (gap.isZero()) continue;

    gaps++;
    console.log(`${stock.material.name} @ ${stock.stockLocationId}: physical=${stock.physicalQuantity} ledger=${ledgerNet} gap=${gap}`);
    if (!apply) continue;

    await prisma.materialTransaction.create({
      data: {
        transactionNumber: `TXN-OB-${stock.materialId.slice(0, 8)}-${stock.stockLocationId.slice(0, 8)}-${Date.now().toString(36)}`,
        materialId: stock.materialId,
        ventureId: stock.ventureId,
        stockLocationId: stock.stockLocationId,
        transactionType: 'OPENING_BALANCE',
        quantityIn: gap.isPositive() ? gap : 0,
        quantityOut: gap.isNegative() ? gap.negated() : 0,
        balanceAfter: gap,
        referenceType: 'OPENING_BALANCE',
        remarks: 'Backfilled: stock existed without a ledger entry',
        performedById: admin.id,
        // Place it before the earliest existing movement so balanceAfter history reads in order.
        createdAt: first ? new Date(first.createdAt.getTime() - 1000) : undefined,
      },
    });
  }

  console.log(`${stocks.length} stock rows checked, ${gaps} with a gap. ${apply ? 'Backfill applied.' : 'Dry run — re-run with --apply to write.'}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
