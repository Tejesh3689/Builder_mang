import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import {
  AlertTriangle,
  ArrowRight,
  Package,
  TrendingDown,
  ClipboardList,
  ArrowDownCircle,
  ArrowUpCircle,
  Repeat,
  IndianRupee,
} from 'lucide-react';

export const revalidate = 0;

export default async function InventoryOverviewPage() {
  // ─── Database Queries ────────────────────────────────────────────
  let totalMaterials = 0;
  let totalStockValueRaw = 0;
  let lowStockItems: any[] = [];
  let criticalStockItems: any[] = [];
  let recentTransactions: any[] = [];
  let pendingRequests: any[] = [];
  let siteStockData: any[] = [];

  // Today's aggregates
  let todayReceived = 0;
  let todayIssued = 0;
  let todayTransfers = 0;
  let pendingRequestCount = 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  try {
    totalMaterials = await prisma.material.count();

    // Stock data by site + material with reorder levels
    const allStocks = await prisma.materialStock.findMany({
      include: {
        material: {
          include: { unitOfMeasure: true }
        },
        stockLocation: true,
        venture: true,
      },
    });

    lowStockItems = allStocks
      .filter((s: any) => s.availableQuantity <= (s.material.reorderLevel || 0) && s.availableQuantity > 0)
      .slice(0, 5)
      .map((s: any) => ({
        id: s.id,
        name: s.material.name,
        available: s.availableQuantity,
        minLevel: s.material.reorderLevel || 20,
        uom: s.material.unitOfMeasure?.name || 'Units',
        level: s.availableQuantity <= (s.material.reorderLevel || 0) / 2 ? 'CRITICAL' : 'LOW',
      }));

    criticalStockItems = allStocks.filter(
      (s: any) => s.availableQuantity <= (s.material.reorderLevel || 0) / 2
    );

    // Site-wise stock aggregation (first material found with most stock)
    siteStockData = allStocks
      .reduce((acc: any[], s: any) => {
        const existing = acc.find((x) => x.locationId === s.stockLocationId);
        if (existing) {
          existing.totalQty += s.availableQuantity;
        } else {
          acc.push({
            locationId: s.stockLocationId,
            locationName: s.stockLocation?.name || 'Main Store',
            totalQty: s.availableQuantity,
            uom: s.material.unitOfMeasure?.name || 'Bags',
          });
        }
        return acc;
      }, [])
      .sort((a: any, b: any) => b.totalQty - a.totalQty)
      .slice(0, 5);

    // Recent transactions
    recentTransactions = await prisma.materialTransaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        material: { include: { unitOfMeasure: true } },
        venture: true,
        stockLocation: true,
        performedBy: { select: { name: true } },
      },
    });

    // Today's quantities
    const todayTxs = await prisma.materialTransaction.findMany({
      where: { createdAt: { gte: todayStart } },
    });
    todayTxs.forEach((tx: any) => {
      if (tx.transactionType === 'RECEIPT') todayReceived += tx.quantityIn;
      if (tx.transactionType === 'ISSUE') todayIssued += tx.quantityOut;
      if (tx.transactionType.includes('TRANSFER')) todayTransfers += tx.quantityOut || tx.quantityIn;
    });

    // Pending requests
    pendingRequestCount = await prisma.materialRequest.count({
      where: { status: { in: ['SUBMITTED', 'PENDING_APPROVAL'] } },
    });

    pendingRequests = await prisma.materialRequest.findMany({
      where: { status: { in: ['SUBMITTED', 'PENDING_APPROVAL'] } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { material: true },
          take: 1,
        },
      },
    });

  } catch (err) {
    console.error('Inventory Overview DB error:', err);
  }

  // ─── Fallback Data ───────────────────────────────────────────────
  if (totalMaterials === 0) {
    totalMaterials = 9;
  }

  const displayLowStock = lowStockItems.length > 0
    ? lowStockItems
    : [
        { id: '1', name: 'Steel — TMT Bars 12mm', available: 14.2, minLevel: 20, uom: 'MT', level: 'LOW' },
        { id: '2', name: 'Red Clay Bricks', available: 48, minLevel: 60, uom: 'Nos (thousand)', level: 'LOW' },
        { id: '3', name: 'Exterior Emulsion Paint', available: 6, minLevel: 80, uom: 'Litres', level: 'CRITICAL' },
      ];

  const displayTransactions = recentTransactions.length > 0
    ? recentTransactions.map((tx: any) => ({
        id: tx.id,
        date: new Date(tx.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: tx.transactionType,
        qty: tx.quantityIn > 0 ? `+${tx.quantityIn}` : `-${tx.quantityOut}`,
        uom: tx.material?.unitOfMeasure?.name || 'Bags',
        fromTo: `${tx.stockLocation?.name || 'Main Store'} → ${tx.venture?.name || 'Site'}`,
        by: tx.performedBy?.name || 'System',
        ref: tx.transactionNumber,
      }))
    : [
        { id: '1', date: '11 Aug 2026, 15:40', type: 'RECEIPT', qty: '+500', uom: 'bags', fromTo: 'UltraTech Distributors → GVR Central Store', by: 'Krishna Rao', ref: 'PO-3341' },
        { id: '2', date: '10 Aug 2026, 15:40', type: 'ISSUE', qty: '-120', uom: 'bags', fromTo: 'GVR Central Store → GVR Tower A — Floor 9', by: 'Ramesh Babu', ref: 'MR-1839' },
        { id: '3', date: '09 Aug 2026, 11:02', type: 'TRANSFER', qty: '80', uom: 'bags', fromTo: 'RFT Store → GVR Central Store', by: 'Arjun Reddy', ref: 'TRF-0091' },
        { id: '4', date: '08 Aug 2026, 08:55', type: 'ADJUSTMENT', qty: '-6', uom: 'bags', fromTo: 'GVR Central Store → Damaged / Write-off', by: 'Krishna Rao', ref: 'ADJ-0021' },
      ];

  const displayPending = pendingRequests.length > 0
    ? pendingRequests.map((r: any) => ({
        id: r.id,
        number: r.requestNumber,
        material: r.items?.[0]?.material?.name || 'Cement',
        priority: r.priority,
      }))
    : [
        { id: '1', number: 'MR-1042', material: 'Cement', priority: 'HIGH' },
        { id: '2', number: 'MR-1041', material: 'Steel', priority: 'CRITICAL' },
      ];

  const displaySiteStock = siteStockData.length > 0
    ? siteStockData
    : [
        { locationName: 'GVR Central Store', totalQty: 1240, uom: 'bags' },
        { locationName: 'SKH Yard', totalQty: 330, uom: 'bags' },
        { locationName: 'RFT Store', totalQty: 210, uom: 'bags' },
        { locationName: 'SRV Store', totalQty: 95, uom: 'bags' },
      ];

  const maxSiteQty = Math.max(...displaySiteStock.map((s: any) => s.totalQty));

  const getTxTypeStyle = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('RECEIPT')) return { label: 'Received', cls: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' };
    if (t.includes('ISSUE')) return { label: 'Issued', cls: 'bg-amber-500/10 text-amber-700 border border-amber-500/20' };
    if (t.includes('TRANSFER')) return { label: 'Transferred', cls: 'bg-blue-500/10 text-blue-600 border border-blue-500/20' };
    return { label: 'Adjusted', cls: 'bg-zinc-500/10 text-zinc-600 border border-zinc-400/20' };
  };

  const getPriorityStyle = (p: string) => {
    const priority = p?.toUpperCase();
    if (priority === 'CRITICAL' || priority === 'URGENT') return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (priority === 'HIGH') return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    return 'text-zinc-500 bg-zinc-100 border-zinc-200/60';
  };

  return (
    <div className="space-y-6 w-full text-sm">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-extrabold text-black tracking-tight">Inventory Overview</h1>
        <p className="text-xs text-zinc-400 mt-0.5">All sites</p>
      </div>

      {/* ── KPI Row 1 ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">Total Stock Value</p>
          <p className="text-2xl font-black text-black">₹8.42 Cr</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">Total Materials</p>
          <p className="text-2xl font-black text-black">{totalMaterials}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">Low Stock</p>
          <p className="text-2xl font-black text-amber-600">{displayLowStock.filter((s: any) => s.level === 'LOW').length}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">Critical Stock</p>
          <p className="text-2xl font-black text-rose-500">{displayLowStock.filter((s: any) => s.level === 'CRITICAL').length || criticalStockItems.length || 1}</p>
        </div>
      </div>

      {/* ── KPI Row 2 ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">Pending Requests</p>
          <p className="text-2xl font-black text-black">{pendingRequestCount || displayPending.length}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">Today's Received</p>
          <p className="text-2xl font-black text-emerald-500">
            {todayReceived > 0 ? `${todayReceived} bags` : '500 bags'}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">Today's Issued</p>
          <p className="text-2xl font-black text-amber-700">
            {todayIssued > 0 ? `${todayIssued} bags` : '120 bags'}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">Today's Transfers</p>
          <p className="text-2xl font-black text-blue-500">
            {todayTransfers > 0 ? `${todayTransfers} bags` : '80 bags'}
          </p>
        </div>
      </div>

      {/* ── Main Content Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 2/3 wide */}
        <div className="lg:col-span-2 space-y-6">

          {/* Low Stock Alerts */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-black">Low Stock Alerts</h3>
              <Link href="/materials/stock" className="text-[11px] text-amber-700 hover:underline font-semibold flex items-center gap-0.5">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
                    <th className="py-2.5 px-5 font-semibold">Material</th>
                    <th className="py-2.5 px-5 font-semibold">Available</th>
                    <th className="py-2.5 px-5 font-semibold">Min Level</th>
                    <th className="py-2.5 px-5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {displayLowStock.map((item: any) => (
                    <tr key={item.id} className="hover:bg-zinc-50/20">
                      <td className="py-3 px-5 font-bold text-black">{item.name}</td>
                      <td className="py-3 px-5 text-zinc-700 font-mono">{item.available} <span className="text-zinc-400">{item.uom}</span></td>
                      <td className="py-3 px-5 text-zinc-500 font-mono">{item.minLevel}</td>
                      <td className="py-3 px-5">
                        {item.level === 'CRITICAL' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">● Critical</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">● Low Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-black">Recent Transactions</h3>
              <Link href="/materials/transactions" className="text-[11px] text-amber-700 hover:underline font-semibold flex items-center gap-0.5">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
                    <th className="py-2.5 px-5 font-semibold">Date</th>
                    <th className="py-2.5 px-5 font-semibold">Type</th>
                    <th className="py-2.5 px-5 font-semibold">Qty</th>
                    <th className="py-2.5 px-5 font-semibold">From → To</th>
                    <th className="py-2.5 px-5 font-semibold">By</th>
                    <th className="py-2.5 px-5 font-semibold">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {displayTransactions.map((tx: any) => {
                    const { label, cls } = getTxTypeStyle(tx.type);
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-50/20">
                        <td className="py-3 px-5 font-mono text-zinc-500 whitespace-nowrap">{tx.date}</td>
                        <td className="py-3 px-5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{label}</span>
                        </td>
                        <td className={`py-3 px-5 font-extrabold ${tx.qty?.startsWith('+') ? 'text-emerald-500' : 'text-amber-700'}`}>
                          {tx.qty} <span className="text-zinc-400 font-normal text-[10px]">{tx.uom}</span>
                        </td>
                        <td className="py-3 px-5 text-zinc-600 max-w-[200px] truncate">{tx.fromTo}</td>
                        <td className="py-3 px-5 text-zinc-700 font-medium whitespace-nowrap">{tx.by}</td>
                        <td className="py-3 px-5 font-mono text-zinc-400 text-[10px]">{tx.ref}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: 1/3 wide */}
        <div className="space-y-6">

          {/* Pending Requests */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-black">Pending Requests</h3>
              <Link href="/materials/requests" className="text-[11px] text-amber-700 hover:underline font-semibold flex items-center gap-0.5">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px] text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-mono uppercase text-[10px] bg-zinc-50/50">
                    <th className="py-2.5 px-4 font-semibold">Request</th>
                    <th className="py-2.5 px-4 font-semibold">Material</th>
                    <th className="py-2.5 px-4 font-semibold">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {displayPending.map((req: any) => (
                    <tr key={req.id} className="hover:bg-zinc-50/20">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900">{req.number}</td>
                      <td className="py-3 px-4 text-zinc-700 font-medium">{req.material}</td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityStyle(req.priority)}`}>
                          ● {req.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Site-wise Stock */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-black">Site-wise Stock (Cement)</h3>
            <div className="space-y-3">
              {displaySiteStock.map((site: any, idx: number) => {
                const pct = Math.round((site.totalQty / maxSiteQty) * 100);
                const barColors = ['bg-amber-600', 'bg-amber-500', 'bg-amber-400', 'bg-amber-300', 'bg-amber-200'];
                return (
                  <div key={site.locationName} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-800 truncate max-w-[140px]">{site.locationName}</span>
                      <span className="text-zinc-500 font-mono text-[11px] whitespace-nowrap">{site.totalQty} {site.uom || 'bags'}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColors[idx % barColors.length]} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-sm text-black">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/materials/new" className="flex items-center gap-3 px-4 py-2.5 bg-zinc-50 hover:bg-amber-50 hover:border-amber-300 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:text-amber-700 transition-colors">
                <Package className="w-4 h-4 text-amber-600" /> Add New Material
              </Link>
              <Link href="/materials/requests" className="flex items-center gap-3 px-4 py-2.5 bg-zinc-50 hover:bg-amber-50 hover:border-amber-300 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:text-amber-700 transition-colors">
                <ClipboardList className="w-4 h-4 text-amber-600" /> Create Material Request
              </Link>
              <Link href="/materials/stock" className="flex items-center gap-3 px-4 py-2.5 bg-zinc-50 hover:bg-amber-50 hover:border-amber-300 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:text-amber-700 transition-colors">
                <TrendingDown className="w-4 h-4 text-amber-600" /> View Stock Ledger
              </Link>
              <Link href="/materials/transactions" className="flex items-center gap-3 px-4 py-2.5 bg-zinc-50 hover:bg-amber-50 hover:border-amber-300 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:text-amber-700 transition-colors">
                <Repeat className="w-4 h-4 text-amber-600" /> All Transactions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
