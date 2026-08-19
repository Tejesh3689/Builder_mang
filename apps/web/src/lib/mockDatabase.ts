'use client';

export interface Skill {
  skill: string;
  category: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Expert';
  experienceYears: number;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  verifiedBy?: string;
  verificationDate?: string;
}

export interface Certification {
  id: string;
  certification: string;
  certificateNo: string;
  issueDate: string;
  expiryDate: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired';
  authority: string;
  documentName?: string;
}

export interface Document {
  id: string;
  name: string;
  category: 'Identity' | 'Employment' | 'Construction' | 'Other';
  fileType: string;
  uploadDate: string;
  expiryDate?: string;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  uploadedBy: string;
}

export interface TrainingSafety {
  id: string;
  training: string;
  trainer: string;
  date: string;
  status: 'Passed' | 'Pending' | 'Expired';
}

export interface AssignmentHistory {
  id: string;
  project: string;
  site: string;
  role: string;
  duration: string;
  status: 'Active' | 'Completed';
}

export interface EmployeeProfile {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  designation: string; // construction specific
  department: string;  // department categories
  status: 'Active' | 'On Leave' | 'Terminated';
  joiningDate: string;
  onboardingStage: 'Candidate' | 'Documents' | 'Verification' | 'Safety Training' | 'Site Orientation' | 'Project Assignment' | 'Active';
  onboardingStatus: 'New Joiner' | 'Documents Pending' | 'Verification Pending' | 'Training Pending' | 'Ready for Deployment' | 'Active';
  currentProject: string;
  currentSite: string;
  reportingManager: string;
  employmentType: 'Full-Time Contractor' | 'Permanent' | 'Daily Wage';
  attendanceRate: string;
  performanceRating: number; // out of 5
  leaveBalancePaid: number;
  leaveBalanceSick: number;
  leaveBalanceCasual: number;
  skills: Skill[];
  certifications: Certification[];
  documents: Document[];
  trainingSafety: TrainingSafety[];
  assignmentHistory: AssignmentHistory[];
  activities: { action: string; timestamp: string }[];
}

const DEFAULT_EMPLOYEES: EmployeeProfile[] = [
  {
    id: 'emp-1001',
    employeeId: 'EMP-1001',
    firstName: 'Arjun',
    lastName: 'Sharma',
    phone: '+91 98450 22341',
    email: 'arjun.sharma@naprocs.in',
    designation: 'Supervisor',
    department: 'Site Operations',
    status: 'Active',
    joiningDate: '04 Feb 2021',
    onboardingStage: 'Active',
    onboardingStatus: 'Active',
    currentProject: 'Green Heights Luxury Apartments',
    currentSite: 'Site A',
    reportingManager: 'Suresh Verma',
    employmentType: 'Permanent',
    attendanceRate: '96%',
    performanceRating: 4.8,
    leaveBalancePaid: 14,
    leaveBalanceSick: 8,
    leaveBalanceCasual: 6,
    skills: [
      { skill: 'Site Supervision', category: 'Operations', proficiency: 'Expert', experienceYears: 6, verificationStatus: 'Verified', verifiedBy: 'Rajesh Kumar', verificationDate: '12 Feb 2021' },
      { skill: 'Concrete Reinforcement', category: 'Civil', proficiency: 'Intermediate', experienceYears: 4, verificationStatus: 'Verified', verifiedBy: 'Rajesh Kumar', verificationDate: '12 Feb 2021' }
    ],
    certifications: [
      { id: 'c1', certification: 'OSHA 30-Hour Construction Safety', certificateNo: 'OSH-3341-AR', issueDate: '2023-08-12', expiryDate: '2028-08-12', status: 'Valid', authority: 'OSHA' }
    ],
    documents: [
      { id: 'd1', name: 'Aadhaar Card Copy.pdf', category: 'Identity', fileType: 'PDF', uploadDate: '2021-02-04', verificationStatus: 'Verified', uploadedBy: 'HR Admin' },
      { id: 'd2', name: 'Employment Agreement.pdf', category: 'Employment', fileType: 'PDF', uploadDate: '2021-02-04', verificationStatus: 'Verified', uploadedBy: 'HR Admin' }
    ],
    trainingSafety: [
      { id: 't1', training: 'Heights & Scaffold Safety Induction', trainer: 'Safety Director', date: '2021-02-05', status: 'Passed' }
    ],
    assignmentHistory: [
      { id: 'a1', project: 'Green Heights Luxury Apartments', site: 'Site A', role: 'Supervisor', duration: 'Jan 2024 - Present', status: 'Active' },
      { id: 'a2', project: 'Skyline Gated Villas', site: 'Site B', role: 'Assistant Supervisor', duration: 'Jul 2023 - Dec 2023', status: 'Completed' }
    ],
    activities: [
      { action: 'Clocked In at Benz Circle Tower', timestamp: 'Today, 08:05 AM' },
      { action: 'Updated task "Column Casting" to complete', timestamp: 'Yesterday, 04:30 PM' }
    ]
  },
  {
    id: 'emp-1002',
    employeeId: 'EMP-1002',
    firstName: 'Priya',
    lastName: 'Nair',
    phone: '+91 99012 33452',
    email: 'priya.nair@naprocs.in',
    designation: 'Site Engineer',
    department: 'Civil Engineering',
    status: 'Active',
    joiningDate: '18 Jun 2020',
    onboardingStage: 'Active',
    onboardingStatus: 'Active',
    currentProject: 'Skyline Gated Villas',
    currentSite: 'Site B',
    reportingManager: 'Ajay Rao',
    employmentType: 'Permanent',
    attendanceRate: '92%',
    performanceRating: 4.5,
    leaveBalancePaid: 18,
    leaveBalanceSick: 6,
    leaveBalanceCasual: 8,
    skills: [
      { skill: 'Civil Engineering', category: 'Engineering', proficiency: 'Expert', experienceYears: 5, verificationStatus: 'Verified', verifiedBy: 'Suresh Verma', verificationDate: '20 Jun 2020' },
      { skill: 'AutoCAD', category: 'Design', proficiency: 'Expert', experienceYears: 4, verificationStatus: 'Verified', verifiedBy: 'Suresh Verma', verificationDate: '20 Jun 2020' }
    ],
    certifications: [
      { id: 'c2', certification: 'Structural Integrity Certification', certificateNo: 'SIC-990-PR', issueDate: '2021-09-10', expiryDate: '2026-09-10', status: 'Expiring Soon', authority: 'All India Civil Association' }
    ],
    documents: [
      { id: 'd3', name: 'PAN Card Copy.pdf', category: 'Identity', fileType: 'PDF', uploadDate: '2020-06-18', verificationStatus: 'Verified', uploadedBy: 'HR Admin' }
    ],
    trainingSafety: [
      { id: 't2', training: 'Electrical Hazards Induction', trainer: 'Safety Inspector', date: '2020-06-19', status: 'Passed' }
    ],
    assignmentHistory: [
      { id: 'a3', project: 'Skyline Gated Villas', site: 'Site B', role: 'Site Engineer', duration: 'Jun 2020 - Present', status: 'Active' }
    ],
    activities: [
      { action: 'Conducted structural alignment inspection', timestamp: 'Today, 09:12 AM' }
    ]
  },
  {
    id: 'emp-1003',
    employeeId: 'EMP-1003',
    firstName: 'Rajesh',
    lastName: 'Gopalan',
    phone: '+91 97412 88921',
    email: 'rajesh.gopalan@naprocs.in',
    designation: 'Safety Officer',
    department: 'Quality Assurance',
    status: 'Active',
    joiningDate: '22 Sep 2019',
    onboardingStage: 'Active',
    onboardingStatus: 'Active',
    currentProject: 'Riverfront Towers',
    currentSite: 'Site A',
    reportingManager: 'Rajesh Kumar',
    employmentType: 'Permanent',
    attendanceRate: '98%',
    performanceRating: 4.9,
    leaveBalancePaid: 20,
    leaveBalanceSick: 10,
    leaveBalanceCasual: 10,
    skills: [
      { skill: 'Safety Management', category: 'Audit', proficiency: 'Expert', experienceYears: 8, verificationStatus: 'Verified', verifiedBy: 'Rajesh Kumar', verificationDate: '2019-09-22' }
    ],
    certifications: [
      { id: 'c3', certification: 'Industrial Safety Level 2 Certificate', certificateNo: 'ISL2-441-RG', issueDate: '2020-01-15', expiryDate: '2025-01-15', status: 'Expired', authority: 'NID Safety Board' }
    ],
    documents: [
      { id: 'd4', name: 'Degree Certificate.pdf', category: 'Identity', fileType: 'PDF', uploadDate: '2019-09-22', verificationStatus: 'Verified', uploadedBy: 'HR Admin' }
    ],
    trainingSafety: [
      { id: 't3', training: 'Chemical & Hazmat Training', trainer: 'Safety Director', date: '2019-09-25', status: 'Passed' }
    ],
    assignmentHistory: [
      { id: 'a4', project: 'Riverfront Towers', site: 'Site A', role: 'Safety Officer', duration: 'Sep 2019 - Present', status: 'Active' }
    ],
    activities: [
      { action: 'Reported loose scaffolding issue', timestamp: 'Yesterday, 11:30 AM' }
    ]
  },
  {
    id: 'emp-1004',
    employeeId: 'EMP-1004',
    firstName: 'Amit',
    lastName: 'Patel',
    phone: '+91 95531 22910',
    email: 'amit.patel@naprocs.in',
    designation: 'Mason',
    department: 'Site Operations',
    status: 'Active',
    joiningDate: '11 Jan 2023',
    onboardingStage: 'Active',
    onboardingStatus: 'Active',
    currentProject: 'Sunrise Villas',
    currentSite: 'Site Alpha',
    reportingManager: 'Arjun Sharma',
    employmentType: 'Daily Wage',
    attendanceRate: '88%',
    performanceRating: 4.2,
    leaveBalancePaid: 0,
    leaveBalanceSick: 2,
    leaveBalanceCasual: 4,
    skills: [
      { skill: 'Masonry Work', category: 'Labor', proficiency: 'Expert', experienceYears: 7, verificationStatus: 'Verified', verifiedBy: 'Arjun Sharma', verificationDate: '11 Jan 2023' }
    ],
    certifications: [],
    documents: [],
    trainingSafety: [
      { id: 't4', training: 'Site Orientation Guidelines', trainer: 'Arjun Sharma', date: '2023-01-11', status: 'Passed' }
    ],
    assignmentHistory: [
      { id: 'a5', project: 'Sunrise Villas', site: 'Site Alpha', role: 'Mason', duration: 'Jan 2023 - Present', status: 'Active' }
    ],
    activities: [
      { action: 'Completed block laying at Tower A Floor 4', timestamp: 'Today, 11:00 AM' }
    ]
  },
  {
    id: 'emp-1005',
    employeeId: 'EMP-1005',
    firstName: 'Rohan',
    lastName: 'Roy',
    phone: '+91 92104 33281',
    email: 'rohan.roy@naprocs.in',
    designation: 'Electrician',
    department: 'Site Operations',
    status: 'Active',
    joiningDate: '02 Aug 2022',
    onboardingStage: 'Active',
    onboardingStatus: 'Active',
    currentProject: 'Green Heights Luxury Apartments',
    currentSite: 'Site A',
    reportingManager: 'Arjun Sharma',
    employmentType: 'Full-Time Contractor',
    attendanceRate: '98%',
    performanceRating: 4.6,
    leaveBalancePaid: 8,
    leaveBalanceSick: 4,
    leaveBalanceCasual: 4,
    skills: [
      { skill: 'Electrical Layouts', category: 'Operations', proficiency: 'Expert', experienceYears: 5, verificationStatus: 'Verified', verifiedBy: 'Arjun Sharma', verificationDate: '2022-08-02' }
    ],
    certifications: [
      { id: 'c4', certification: 'Licensed Grid Electrician', certificateNo: 'LGE-2210', issueDate: '2022-05-10', expiryDate: '2027-05-10', status: 'Valid', authority: 'Electrical Regulatory Board' }
    ],
    documents: [],
    trainingSafety: [
      { id: 't5', training: 'Electrical Hazards Induction', trainer: 'Safety Officer', date: '2022-08-03', status: 'Passed' }
    ],
    assignmentHistory: [
      { id: 'a6', project: 'Green Heights Luxury Apartments', site: 'Site A', role: 'Electrician', duration: 'Aug 2022 - Present', status: 'Active' }
    ],
    activities: [
      { action: 'Laid conduits on Floor 8 ceiling', timestamp: 'Today, 02:40 PM' }
    ]
  },
  {
    id: 'emp-1006',
    employeeId: 'EMP-1006',
    firstName: 'Vikram',
    lastName: 'Singh',
    phone: '+91 98912 44321',
    email: 'vikram.singh@naprocs.in',
    designation: 'Plumber',
    department: 'Site Operations',
    status: 'On Leave',
    joiningDate: '19 Nov 2021',
    onboardingStage: 'Active',
    onboardingStatus: 'Active',
    currentProject: 'Skyline Gated Villas',
    currentSite: 'Site B',
    reportingManager: 'Suresh Kumar',
    employmentType: 'Full-Time Contractor',
    attendanceRate: '81%',
    performanceRating: 4.0,
    leaveBalancePaid: 10,
    leaveBalanceSick: 5,
    leaveBalanceCasual: 5,
    skills: [
      { skill: 'Plumbing Layouts', category: 'Operations', proficiency: 'Expert', experienceYears: 4, verificationStatus: 'Verified', verifiedBy: 'Suresh Kumar', verificationDate: '2021-11-19' }
    ],
    certifications: [],
    documents: [],
    trainingSafety: [
      { id: 't6', training: 'Site Orientation Guidelines', trainer: 'Suresh Kumar', date: '2021-11-20', status: 'Passed' }
    ],
    assignmentHistory: [
      { id: 'a7', project: 'Skyline Gated Villas', site: 'Site B', role: 'Plumber', duration: 'Nov 2021 - Present', status: 'Active' }
    ],
    activities: [
      { action: 'Applied for sick leave', timestamp: '2 days ago' }
    ]
  },
  {
    id: 'emp-1007',
    employeeId: 'EMP-1007',
    firstName: 'Suresh',
    lastName: 'Patil',
    phone: '+91 97321 00214',
    email: 'suresh.patil@naprocs.in',
    designation: 'Quantity Surveyor',
    department: 'Planning & Civil',
    status: 'Active',
    joiningDate: '05 May 2023',
    onboardingStage: 'Active',
    onboardingStatus: 'Active',
    currentProject: 'Skyline Gated Villas',
    currentSite: 'Site B',
    reportingManager: 'Suresh Verma',
    employmentType: 'Permanent',
    attendanceRate: '97%',
    performanceRating: 4.7,
    leaveBalancePaid: 15,
    leaveBalanceSick: 7,
    leaveBalanceCasual: 6,
    skills: [
      { skill: 'Quantity Surveying', category: 'Planning', proficiency: 'Expert', experienceYears: 6, verificationStatus: 'Verified', verifiedBy: 'Suresh Verma', verificationDate: '2023-05-05' }
    ],
    certifications: [],
    documents: [],
    trainingSafety: [],
    assignmentHistory: [
      { id: 'a8', project: 'Skyline Gated Villas', site: 'Site B', role: 'Quantity Surveyor', duration: 'May 2023 - Present', status: 'Active' }
    ],
    activities: [
      { action: 'Completed billing sheet for May-June TMT Rebars', timestamp: '3 days ago' }
    ]
  },
  {
    id: 'emp-1008',
    employeeId: 'EMP-1008',
    firstName: 'Preeti',
    lastName: 'Sen',
    phone: '+91 91102 33481',
    email: 'preeti.sen@naprocs.in',
    designation: 'Architect',
    department: 'Planning & Civil',
    status: 'Active',
    joiningDate: '27 Jul 2020',
    onboardingStage: 'Active',
    onboardingStatus: 'Active',
    currentProject: 'Riverfront Towers',
    currentSite: 'Site A',
    reportingManager: 'Suresh Verma',
    employmentType: 'Permanent',
    attendanceRate: '93%',
    performanceRating: 4.6,
    leaveBalancePaid: 16,
    leaveBalanceSick: 8,
    leaveBalanceCasual: 8,
    skills: [
      { skill: 'AutoCAD', category: 'Design', proficiency: 'Expert', experienceYears: 7, verificationStatus: 'Verified', verifiedBy: 'Suresh Verma', verificationDate: '2020-07-27' }
    ],
    certifications: [],
    documents: [],
    trainingSafety: [],
    assignmentHistory: [
      { id: 'a9', project: 'Riverfront Towers', site: 'Site A', role: 'Architect', duration: 'Jul 2020 - Present', status: 'Active' }
    ],
    activities: [
      { action: 'Uploaded revised elevation drawing for Tower B', timestamp: 'Today, 10:00 AM' }
    ]
  },
  {
    id: 'emp-candidate-1',
    employeeId: 'EMP-2001',
    firstName: 'Sunita',
    lastName: 'Rao',
    phone: '+91 90021 88310',
    email: 'sunita.rao@candidate.in',
    designation: 'Plumber',
    department: 'Site Operations',
    status: 'Active',
    joiningDate: '22 Aug 2026',
    onboardingStage: 'Documents',
    onboardingStatus: 'Documents Pending',
    currentProject: 'Unassigned',
    currentSite: 'Unassigned',
    reportingManager: 'Suresh Kumar',
    employmentType: 'Full-Time Contractor',
    attendanceRate: '—',
    performanceRating: 0,
    leaveBalancePaid: 0,
    leaveBalanceSick: 0,
    leaveBalanceCasual: 0,
    skills: [
      { skill: 'Plumbing Layouts', category: 'Labor', proficiency: 'Intermediate', experienceYears: 3, verificationStatus: 'Pending' }
    ],
    certifications: [],
    documents: [],
    trainingSafety: [],
    assignmentHistory: [],
    activities: [
      { action: 'Created onboarding profile', timestamp: '2 days ago' }
    ]
  },
  {
    id: 'emp-candidate-2',
    employeeId: 'EMP-2002',
    firstName: 'Mohit',
    lastName: 'Sharma',
    phone: '+91 93310 44215',
    email: 'mohit.sharma@candidate.in',
    designation: 'Supervisor',
    department: 'Site Operations',
    status: 'Active',
    joiningDate: '19 Aug 2026',
    onboardingStage: 'Safety Training',
    onboardingStatus: 'Training Pending',
    currentProject: 'Unassigned',
    currentSite: 'Unassigned',
    reportingManager: 'Ajay Rao',
    employmentType: 'Permanent',
    attendanceRate: '—',
    performanceRating: 0,
    leaveBalancePaid: 10,
    leaveBalanceSick: 5,
    leaveBalanceCasual: 5,
    skills: [
      { skill: 'Site Supervision', category: 'Operations', proficiency: 'Expert', experienceYears: 4, verificationStatus: 'Verified', verifiedBy: 'HR Team', verificationDate: '2026-08-14' }
    ],
    certifications: [],
    documents: [
      { id: 'd5', name: 'Aadhaar Card Copy.pdf', category: 'Identity', fileType: 'PDF', uploadDate: '2026-08-14', verificationStatus: 'Verified', uploadedBy: 'HR Admin' }
    ],
    trainingSafety: [],
    assignmentHistory: [],
    activities: [
      { action: 'Uploaded identity proof', timestamp: '3 days ago' }
    ]
  }
];

export function getLocalEmployees(): EmployeeProfile[] {
  if (typeof window === 'undefined') return DEFAULT_EMPLOYEES;
  const stored = localStorage.getItem('naprocs_employees');
  if (!stored) {
    localStorage.setItem('naprocs_employees', JSON.stringify(DEFAULT_EMPLOYEES));
    return DEFAULT_EMPLOYEES;
  }
  return JSON.parse(stored);
}

export function saveLocalEmployees(employees: EmployeeProfile[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('naprocs_employees', JSON.stringify(employees));
  }
}

export function addLocalEmployee(emp: Partial<EmployeeProfile>): EmployeeProfile {
  const list = getLocalEmployees();
  const index = list.length + 1;
  const newEmp: EmployeeProfile = {
    id: `emp-${Date.now()}`,
    employeeId: emp.employeeId || `EMP-${1000 + index}`,
    firstName: emp.firstName || '',
    lastName: emp.lastName || '',
    phone: emp.phone || '',
    email: emp.email || '',
    designation: emp.designation || 'Site Operations Hand',
    department: emp.department || 'Site Operations',
    status: emp.status || 'Active',
    joiningDate: emp.joiningDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    onboardingStage: emp.onboardingStage || 'Active',
    onboardingStatus: emp.onboardingStatus || 'Active',
    currentProject: emp.currentProject || 'Unassigned',
    currentSite: emp.currentSite || 'Unassigned',
    reportingManager: emp.reportingManager || '—',
    employmentType: emp.employmentType || 'Permanent',
    attendanceRate: emp.attendanceRate || '—',
    performanceRating: emp.performanceRating || 0,
    leaveBalancePaid: emp.leaveBalancePaid || 12,
    leaveBalanceSick: emp.leaveBalanceSick || 6,
    leaveBalanceCasual: emp.leaveBalanceCasual || 6,
    skills: emp.skills || [],
    certifications: emp.certifications || [],
    documents: emp.documents || [],
    trainingSafety: emp.trainingSafety || [],
    assignmentHistory: emp.assignmentHistory || [],
    activities: emp.activities || [{ action: 'Created Employee Profile', timestamp: 'Just now' }]
  };

  list.push(newEmp);
  saveLocalEmployees(list);
  return newEmp;
}

export function updateLocalEmployee(id: string, updates: Partial<EmployeeProfile>): EmployeeProfile | null {
  const list = getLocalEmployees();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  const updated = { ...list[idx], ...updates };
  list[idx] = updated;
  saveLocalEmployees(list);
  return updated;
}

export function deleteLocalEmployee(id: string): boolean {
  const list = getLocalEmployees();
  const filtered = list.filter((e) => e.id !== id);
  if (filtered.length === list.length) return false;
  saveLocalEmployees(filtered);
  return true;
}

// ----------------------------------------------------
// MANAGERS & SUPERVISORS INTERFACES & HELPERS
// ----------------------------------------------------

export interface ManagerProfile {
  id: string;
  name: string;
  ventures: string[];
  supervisors: number;
  employeeCount: number;
  openIssues: number;
  pendingRequests: number;
  joined: string;
  phone: string;
  email: string;
}

export interface SupervisorProfile {
  id: string;
  name: string;
  venture: string;
  site: string;
  employees: number;
  dailyReports: number;
  openTasks: number;
  openIssues: number;
  phone: string;
}

const DEFAULT_MANAGERS: ManagerProfile[] = [
  {
    id: 'MGR-01',
    name: 'Arjun Reddy',
    ventures: ['Green Valley Residency', 'Riverfront Towers', 'Coastal Breeze Apartments'],
    supervisors: 2,
    employeeCount: 43,
    openIssues: 2,
    pendingRequests: 1,
    joined: '11 Apr 2018',
    phone: '+91 98220 33001',
    email: 'arjun.reddy@naprocs.in'
  },
  {
    id: 'MGR-02',
    name: 'Priya Nair',
    ventures: ['Skyline Heights', 'Sunrise Villas'],
    supervisors: 2,
    employeeCount: 43,
    openIssues: 8,
    pendingRequests: 3,
    joined: '02 Sep 2019',
    phone: '+91 98220 33002',
    email: 'priya.nair@naprocs.in'
  }
];

const DEFAULT_SUPERVISORS: SupervisorProfile[] = [
  {
    id: 'SUP-01',
    name: 'Krishna Rao',
    venture: 'Green Valley Residency',
    site: 'GVR — Tower A',
    employees: 8,
    dailyReports: 212,
    openTasks: 4,
    openIssues: 1,
    phone: '+91 98450 11234'
  },
  {
    id: 'SUP-02',
    name: 'Suresh Kumar',
    venture: 'Skyline Heights',
    site: 'SKH — Block C',
    employees: 11,
    dailyReports: 178,
    openTasks: 7,
    openIssues: 5,
    phone: '+91 98450 11235'
  },
  {
    id: 'SUP-03',
    name: 'Manoj Verma',
    venture: 'Riverfront Towers',
    site: 'RFT — Tower B',
    employees: 9,
    dailyReports: 301,
    openTasks: 2,
    openIssues: 0,
    phone: '+91 98450 11236'
  },
  {
    id: 'SUP-04',
    name: 'Ravi Teja',
    venture: 'Sunrise Villas',
    site: 'SRV — Villa Block 1-6',
    employees: 6,
    dailyReports: 34,
    openTasks: 5,
    openIssues: 3,
    phone: '+91 98450 11237'
  }
];

export function getLocalManagers(): ManagerProfile[] {
  if (typeof window === 'undefined') return DEFAULT_MANAGERS;
  const stored = localStorage.getItem('naprocs_managers');
  if (!stored) {
    localStorage.setItem('naprocs_managers', JSON.stringify(DEFAULT_MANAGERS));
    return DEFAULT_MANAGERS;
  }
  return JSON.parse(stored);
}

export function saveLocalManagers(managers: ManagerProfile[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('naprocs_managers', JSON.stringify(managers));
  }
}

export function addLocalManager(mgr: Partial<ManagerProfile>): ManagerProfile {
  const list = getLocalManagers();
  const index = list.length + 1;
  const newMgr: ManagerProfile = {
    id: mgr.id || `MGR-${10 + index}`,
    name: mgr.name || '',
    ventures: mgr.ventures || [],
    supervisors: mgr.supervisors || 0,
    employeeCount: mgr.employeeCount || 0,
    openIssues: mgr.openIssues || 0,
    pendingRequests: mgr.pendingRequests || 0,
    joined: mgr.joined || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    phone: mgr.phone || '',
    email: mgr.email || ''
  };
  list.push(newMgr);
  saveLocalManagers(list);
  return newMgr;
}

export function getLocalSupervisors(): SupervisorProfile[] {
  if (typeof window === 'undefined') return DEFAULT_SUPERVISORS;
  const stored = localStorage.getItem('naprocs_supervisors');
  if (!stored) {
    localStorage.setItem('naprocs_supervisors', JSON.stringify(DEFAULT_SUPERVISORS));
    return DEFAULT_SUPERVISORS;
  }
  return JSON.parse(stored);
}

export function saveLocalSupervisors(supervisors: SupervisorProfile[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('naprocs_supervisors', JSON.stringify(supervisors));
  }
}

export function addLocalSupervisor(sup: Partial<SupervisorProfile>): SupervisorProfile {
  const list = getLocalSupervisors();
  const index = list.length + 1;
  const newSup: SupervisorProfile = {
    id: sup.id || `SUP-${10 + index}`,
    name: sup.name || '',
    venture: sup.venture || '',
    site: sup.site || '',
    employees: sup.employees || 0,
    dailyReports: sup.dailyReports || 0,
    openTasks: sup.openTasks || 0,
    openIssues: sup.openIssues || 0,
    phone: sup.phone || ''
  };
  list.push(newSup);
  saveLocalSupervisors(list);
  return newSup;
}

