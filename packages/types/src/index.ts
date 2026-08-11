export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'SITE_ENGINEER' | 'STORE_MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface Venture {
  id: string;
  name: string;
  code: string;
  location: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  createdAt: Date;
}

export interface Employee {
  id: string;
  employeeId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  status: 'ACTIVE' | 'TERMINATED' | 'ON_LEAVE';
  ventures: Venture[];
}

export interface Material {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  unitOfMeasureId: string;
  description?: string;
}

export type TransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'STOCK_TRANSFER';

export interface MaterialTransaction {
  id: string;
  materialId: string;
  ventureId: string;
  quantity: number;
  type: TransactionType;
  referenceId?: string; // Links to requests/receipts/issues/transfers
  userId: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  attachments?: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
  }[];
}
