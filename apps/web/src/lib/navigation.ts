import { UserRole } from '@prisma/client';

export type NavItem = { href: string; label: string; icon: string; alert?: boolean };
export type NavGroup = { group: string | null; items: NavItem[] };

export type RouteMetadata = {
  pattern: RegExp;
  title: string;
  parentHref: string; // Used for sidebar active state highlighting
  breadcrumb: string;
};

// Route metadata for breadcrumbs and sidebar active state.
// Order matters: more specific routes (like /employees/new) should appear before less specific ones (like /employees/[id]).
export const ROUTE_METADATA: RouteMetadata[] = [
  // Dashboard
  { pattern: /^\/dashboard$/, title: 'Dashboard Overview', parentHref: '/dashboard', breadcrumb: 'Dashboard' },

  // Admin
  { pattern: /^\/admin\/users\/new$/, title: 'Add New User', parentHref: '/admin/users', breadcrumb: 'System Settings / Users / Add User' },
  { pattern: /^\/admin\/users\/[^/]+\/edit$/, title: 'Edit User', parentHref: '/admin/users', breadcrumb: 'System Settings / Users / Edit User' },
  { pattern: /^\/admin\/users\/[^/]+\/delete$/, title: 'Delete User', parentHref: '/admin/users', breadcrumb: 'System Settings / Users / Delete User' },
  { pattern: /^\/admin\/users$/, title: 'Users', parentHref: '/admin/users', breadcrumb: 'System Settings / Users' },
  { pattern: /^\/admin\/roles\/new$/, title: 'Add Role', parentHref: '/admin/roles', breadcrumb: 'System Settings / Roles & Permissions / Add Role' },
  { pattern: /^\/admin\/roles\/[^/]+\/manage$/, title: 'Manage Role', parentHref: '/admin/roles', breadcrumb: 'System Settings / Roles & Permissions / Manage Role' },
  { pattern: /^\/admin\/roles$/, title: 'Roles & Permissions', parentHref: '/admin/roles', breadcrumb: 'System Settings / Roles & Permissions' },
  { pattern: /^\/admin\/branches\/new$/, title: 'Add Branch', parentHref: '/admin/branches', breadcrumb: 'System Settings / Branches / Add Branch' },
  { pattern: /^\/admin\/branches\/[^/]+$/, title: 'Branch Details', parentHref: '/admin/branches', breadcrumb: 'System Settings / Branches / Branch Details' },
  { pattern: /^\/admin\/branches$/, title: 'Branches / Locations', parentHref: '/admin/branches', breadcrumb: 'System Settings / Branches' },
  { pattern: /^\/admin\/audit-logs\/filter$/, title: 'Filter Audit Logs', parentHref: '/admin/audit-logs', breadcrumb: 'System Settings / Audit Logs / Filter' },
  { pattern: /^\/admin\/audit-logs$/, title: 'Audit Logs', parentHref: '/admin/audit-logs', breadcrumb: 'System Settings / Audit Logs' },
  { pattern: /^\/admin\/settings\/upload-logo$/, title: 'Upload Logo', parentHref: '/admin/settings', breadcrumb: 'System Settings / Company Settings / Upload Logo' },
  { pattern: /^\/admin\/settings$/, title: 'Company Settings', parentHref: '/admin/settings', breadcrumb: 'System Settings / Company Settings' },
  { pattern: /^\/admin$/, title: 'System Administration', parentHref: '/admin', breadcrumb: 'System Settings' },

  // Employees & HR
  { pattern: /^\/employees\/dashboard$/, title: 'HR Dashboard', parentHref: '/employees/dashboard', breadcrumb: 'Human Resources / HR Dashboard' },
  { pattern: /^\/employees\/new$/, title: 'Add Employee', parentHref: '/employees', breadcrumb: 'Human Resources / Employee Master / Add Employee' },
  { pattern: /^\/employees\/managers$/, title: 'Managers', parentHref: '/employees/team', breadcrumb: 'Human Resources / Managers' },
  { pattern: /^\/employees\/supervisors$/, title: 'Supervisors', parentHref: '/employees/supervisors', breadcrumb: 'Human Resources / Supervisors' },
  { pattern: /^\/employees\/team$/, title: 'Organization Tree', parentHref: '/employees/team', breadcrumb: 'Human Resources / Organization Tree' },
  { pattern: /^\/employees\/[^/]+\/documents$/, title: 'Employee Documents', parentHref: '/employees', breadcrumb: 'Human Resources / Employee Master / Documents' },
  { pattern: /^\/employees\/[^/]+\/edit$/, title: 'Edit Employee', parentHref: '/employees', breadcrumb: 'Human Resources / Employee Master / Edit Employee' },
  { pattern: /^\/employees\/[^/]+$/, title: 'Employee Profile', parentHref: '/employees', breadcrumb: 'Human Resources / Employee Master / Employee Profile' },
  { pattern: /^\/employees$/, title: 'Employee Master', parentHref: '/employees', breadcrumb: 'Human Resources / Employee Master' },
  { pattern: /^\/workforce$/, title: 'Workforce Assignments', parentHref: '/workforce', breadcrumb: 'Human Resources / Workforce Assignments' },
  { pattern: /^\/attendance\/mark$/, title: 'Mark Attendance', parentHref: '/attendance', breadcrumb: 'Human Resources / Attendance / Mark Attendance' },
  { pattern: /^\/attendance$/, title: 'Global Attendance', parentHref: '/attendance', breadcrumb: 'Human Resources / Attendance' },
  { pattern: /^\/leave$/, title: 'Leave & Holidays', parentHref: '/leave', breadcrumb: 'Human Resources / Leave & Holidays' },

  // Ventures (Corporate)
  { pattern: /^\/ventures\/[^/]+\/announcements$/, title: 'Venture Announcements', parentHref: '/ventures', breadcrumb: 'Corporate / Ventures / Announcements' },
  { pattern: /^\/ventures\/[^/]+$/, title: 'Venture Workspace', parentHref: '/ventures', breadcrumb: 'Corporate / Ventures / Workspace' },
  { pattern: /^\/ventures$/, title: 'Ventures', parentHref: '/ventures', breadcrumb: 'Corporate / Ventures' },
  { pattern: /^\/onboarding$/, title: 'Onboarding Pipeline', parentHref: '/onboarding', breadcrumb: 'Corporate / Onboarding Pipeline' },
  { pattern: /^\/approvals$/, title: 'Pending Approvals', parentHref: '/approvals', breadcrumb: 'Corporate / Pending Approvals' },
  { pattern: /^\/compliance$/, title: 'Compliance & Permits', parentHref: '/compliance', breadcrumb: 'Corporate / Compliance & Permits' },

  // Materials & Inventory
  { pattern: /^\/materials\/new$/, title: 'Add Material', parentHref: '/materials/list', breadcrumb: 'Resource Management / Material Catalog / Add Material' },
  { pattern: /^\/materials\/list$/, title: 'Material Catalog', parentHref: '/materials/list', breadcrumb: 'Resource Management / Material Catalog' },
  { pattern: /^\/materials\/stock\/alerts$/, title: 'Inventory Alerts', parentHref: '/materials/stock', breadcrumb: 'Resource Management / Stock Alerts' },
  { pattern: /^\/materials\/stock$/, title: 'Stock Movements', parentHref: '/materials/stock', breadcrumb: 'Resource Management / Stock Movements' },
  { pattern: /^\/materials\/request$/, title: 'Material Request', parentHref: '/materials', breadcrumb: 'Resource Management / Inventory Overview / Material Request' },
  { pattern: /^\/materials\/requests$/, title: 'Material Requests', parentHref: '/materials', breadcrumb: 'Resource Management / Inventory Overview / Requests' },
  { pattern: /^\/materials\/transactions$/, title: 'Material Transactions', parentHref: '/materials', breadcrumb: 'Resource Management / Inventory Overview / Transactions' },
  { pattern: /^\/materials$/, title: 'Inventory Overview', parentHref: '/materials', breadcrumb: 'Resource Management / Inventory Overview' },
  { pattern: /^\/assets$/, title: 'Asset Management', parentHref: '/assets', breadcrumb: 'Resource Management / Asset Management' },

  // Others
  { pattern: /^\/chat\/[^/]+$/, title: 'Venture Chat', parentHref: '/chat', breadcrumb: 'Enterprise / Chat / Venture' },
  { pattern: /^\/chat$/, title: 'Enterprise Chat', parentHref: '/chat', breadcrumb: 'Enterprise / Chat' },
  { pattern: /^\/field-work\/assign$/, title: 'Assign Field Work', parentHref: '/field-work', breadcrumb: 'Operations / Field Work / Assign' },
  { pattern: /^\/field-work$/, title: 'Field Work', parentHref: '/field-work', breadcrumb: 'Operations / Field Work' },
  { pattern: /^\/meetings$/, title: 'Meetings', parentHref: '/meetings', breadcrumb: 'Operations / Meetings' },
  { pattern: /^\/notifications$/, title: 'Notifications', parentHref: '/notifications', breadcrumb: 'System / Notifications' },
  { pattern: /^\/profile$/, title: 'Profile', parentHref: '/profile', breadcrumb: 'System / Profile' },
  { pattern: /^\/demo$/, title: 'Component Demo', parentHref: '/demo', breadcrumb: 'Enterprise / Component Demo' },
  { pattern: /^\/unauthorized$/, title: 'Unauthorized', parentHref: '/dashboard', breadcrumb: 'Unauthorized' },

  // Reports
  { pattern: /^\/reports\/team$/, title: 'Analytics & Reports', parentHref: '/reports/team', breadcrumb: 'Enterprise / Analytics & Reports' },
  { pattern: /^\/reports\/employees\/export$/, title: 'Export Employees Report', parentHref: '/reports/employees', breadcrumb: 'Enterprise / Analytics / Export Employees' },
  { pattern: /^\/reports\/employees$/, title: 'Employees Report', parentHref: '/reports/employees', breadcrumb: 'Enterprise / Analytics / Employees' },
  { pattern: /^\/reports\/inventory\/export$/, title: 'Export Inventory Report', parentHref: '/reports/inventory', breadcrumb: 'Enterprise / Analytics / Export Inventory' },
  { pattern: /^\/reports\/inventory$/, title: 'Inventory Report', parentHref: '/reports/inventory', breadcrumb: 'Enterprise / Analytics / Inventory' },
  { pattern: /^\/reports\/projects\/export$/, title: 'Export Projects Report', parentHref: '/reports/projects', breadcrumb: 'Enterprise / Analytics / Export Projects' },
  { pattern: /^\/reports\/projects$/, title: 'Projects Report', parentHref: '/reports/projects', breadcrumb: 'Enterprise / Analytics / Projects' },
  { pattern: /^\/reports$/, title: 'Reports', parentHref: '/reports', breadcrumb: 'Enterprise / Reports' },
];

export function getRouteMetadata(pathname: string): RouteMetadata | null {
  for (const meta of ROUTE_METADATA) {
    if (meta.pattern.test(pathname)) {
      return meta;
    }
  }
  return null;
}

export function getNavGroups(role: string): NavGroup[] {
  if (role === 'SUPERVISOR') {
    return [
      {
        group: null,
        items: [
          { href: '/dashboard', label: 'Dashboard', icon: 'home' },
        ],
      },
      {
        group: 'Team Management',
        items: [
          { href: '/employees/team', label: 'My Team', icon: 'users' },
          { href: '/attendance', label: 'Attendance', icon: 'check' },
          { href: '/leave', label: 'Leave Management', icon: 'activity' },
        ],
      },
      {
        group: 'Operations',
        items: [
          { href: '/field-work', label: 'Field Work', icon: 'tasks' },
          { href: '/approvals', label: 'Approvals', icon: 'check' },
          { href: '/reports/team', label: 'Reports', icon: 'file' },
          { href: '/meetings', label: 'Meetings', icon: 'users' },
          { href: '/assets', label: 'Assets', icon: 'box' },
        ],
      },
      {
        group: 'Inventory',
        items: [
          { href: '/materials', label: 'Inventory Overview', icon: 'box' },
          { href: '/materials/list', label: 'Materials', icon: 'cube' },
          { href: '/materials/stock', label: 'Stock Movements', icon: 'stack' },
        ],
      },
      {
        group: 'Communication',
        items: [
          { href: '/chat', label: 'Venture Chat', icon: 'chat' },
        ],
      },
      {
        group: 'System',
        items: [
          { href: '/notifications', label: 'Notifications', icon: 'bell', alert: true },
          { href: '/profile', label: 'Profile', icon: 'settings' },
        ],
      },
    ];
  }

  if (role === 'MANAGER') {
    return [
      {
        group: null,
        items: [
          { href: '/dashboard', label: 'Dashboard', icon: 'home' },
        ],
      },
      {
        group: 'Ventures',
        items: [
          { href: '/ventures', label: 'Venture Management', icon: 'layers' },
          { href: '/approvals', label: 'Pending Approvals', icon: 'check' },
        ],
      },
      {
        group: 'Team & HR',
        items: [
          { href: '/employees/team', label: 'Extended Team', icon: 'users' },
          { href: '/attendance', label: 'Global Attendance', icon: 'check' },
          { href: '/leave', label: 'Leave Requests', icon: 'activity' },
        ],
      },
      {
        group: 'Resources',
        items: [
          { href: '/materials', label: 'Inventory Overview', icon: 'box' },
          { href: '/materials/list', label: 'Material Master', icon: 'cube' },
          { href: '/materials/stock', label: 'Stock Alerts', icon: 'alert' },
        ],
      },
      {
        group: 'Analytics',
        items: [
          { href: '/reports/team', label: 'Productivity Reports', icon: 'file' },
        ],
      },
    ];
  }

  // Admin and other roles (including PROC)
  const groups: NavGroup[] = [
    {
      group: null,
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: 'home' },
      ],
    },
    {
      group: 'Corporate',
      items: [
        { href: '/ventures', label: 'Ventures', icon: 'layers' },
        { href: '/onboarding', label: 'Onboarding Pipeline', icon: 'activity' },
        { href: '/approvals', label: 'Pending Approvals', icon: 'check', alert: true },
        { href: '/compliance', label: 'Compliance & Permits', icon: 'shield' },
      ],
    },
    {
      group: 'Human Resources',
      items: [
        { href: '/employees/dashboard', label: 'HR Dashboard', icon: 'building' },
        { href: '/employees', label: 'Employee Master', icon: 'users' },
        { href: '/workforce', label: 'Workforce Assignments', icon: 'tasks' },
        { href: '/employees/supervisors', label: 'Supervisors', icon: 'users' },
        { href: '/employees/team', label: 'Organization Tree', icon: 'users' },
        { href: '/attendance', label: 'Global Attendance', icon: 'check' },
        { href: '/leave', label: 'Leave & Holidays', icon: 'activity' },
      ],
    },
    {
      group: 'Resource Management',
      items: [
        { href: '/materials', label: 'Inventory Overview', icon: 'box' },
        { href: '/materials/list', label: 'Material Catalog', icon: 'cube' },
        { href: '/materials/stock', label: 'Stock Movements', icon: 'stack' },
        { href: '/assets', label: 'Asset Management', icon: 'truck' },
      ],
    },
    {
      group: 'Enterprise',
      items: [
        { href: '/chat', label: 'Enterprise Chat', icon: 'chat' },
        { href: '/reports/team', label: 'Analytics & Reports', icon: 'file' },
        { href: '/demo', label: 'Component Demo', icon: 'package' },
      ],
    }
  ];

  if (role === 'ADMIN') {
    groups.push({
      group: 'System Settings',
      items: [
        { href: '/admin/users', label: 'Users', icon: 'users' },
        { href: '/admin/roles', label: 'Roles & Permissions', icon: 'shield' },
        { href: '/admin/branches', label: 'Branches / Locations', icon: 'pin' },
        { href: '/admin/audit-logs', label: 'Audit Logs', icon: 'list' },
        { href: '/admin/settings', label: 'Company Settings', icon: 'settings' },
      ],
    });
  }

  return groups;
}

export function getSafeReturnTo(url: string | null | undefined, fallback: string = '/dashboard'): string {
  if (!url) return fallback;
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }
  return fallback;
}
