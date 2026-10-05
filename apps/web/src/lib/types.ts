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
