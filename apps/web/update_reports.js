const fs = require('fs');

function updateProjects() {
  let code = fs.readFileSync('src/app/(dashboard)/reports/projects/page.tsx', 'utf8');
  code = code.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { ExportButton } from '@/components/ui/ExportButton';\nimport { formatCurrency } from '@/lib/format';");
  code = code.replace(/const formatCurrency = \(val: number\) => \{[\s\S]*?\}\.format\(val\);\s*};\s*/, '');
  code = code.replace(
    /<Link href=\"\/reports\/projects\/export\"[^>]*>Export Report<\/Link>/,
    `<ExportButton module="project-report" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 inline-block self-start" label="Export Report" />`
  );
  fs.writeFileSync('src/app/(dashboard)/reports/projects/page.tsx', code);
}

function updateEmployees() {
  let code = fs.readFileSync('src/app/(dashboard)/reports/employees/page.tsx', 'utf8');
  code = code.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { ExportButton } from '@/components/ui/ExportButton';");
  code = code.replace(
    /<Link href=\"\/reports\/employees\/export\"[^>]*>Export Report<\/Link>/,
    `<ExportButton module="employee-report" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 inline-block self-start" label="Export Report" />`
  );
  fs.writeFileSync('src/app/(dashboard)/reports/employees/page.tsx', code);
}

function updateInventory() {
  let code = fs.readFileSync('src/app/(dashboard)/reports/inventory/page.tsx', 'utf8');
  code = code.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { ExportButton } from '@/components/ui/ExportButton';");
  code = code.replace(
    /<Link href=\"\/reports\/inventory\/export\"[^>]*>Export Report<\/Link>/,
    `<ExportButton module="inventory-report" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 inline-block self-start" label="Export Report" />`
  );
  fs.writeFileSync('src/app/(dashboard)/reports/inventory/page.tsx', code);
}

function updateTransactions() {
  let code = fs.readFileSync('src/app/(dashboard)/materials/transactions/page.tsx', 'utf8');
  code = code.replace("import { prisma } from '@/lib/db';", "import { prisma } from '@/lib/db';\nimport { ExportButton } from '@/components/ui/ExportButton';");
  code = code.replace(
    /<h1 className=\"text-2xl font-bold tracking-tight text-zinc-900\">Material Transactions<\/h1>/,
    `<h1 className="text-2xl font-bold tracking-tight text-zinc-900">Material Transactions</h1>\n          <ExportButton module="transactions" />`
  );
  fs.writeFileSync('src/app/(dashboard)/materials/transactions/page.tsx', code);
}

try { updateProjects(); } catch(e) { console.error('projects:', e) }
try { updateEmployees(); } catch(e) { console.error('employees:', e) }
try { updateInventory(); } catch(e) { console.error('inventory:', e) }
try { updateTransactions(); } catch(e) { console.error('transactions:', e) }
