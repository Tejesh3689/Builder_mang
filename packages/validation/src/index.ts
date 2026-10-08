import { z } from 'zod';
import { toCalendarDate, leaveDurationDays, MAX_LEAVE_DAYS } from './leave';
export * from './leave';

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

// Employee input validation lives in apps/web/src/lib/validation/employee.ts (single authoritative schema).

export const MaterialRequestSchema = z.object({
  ventureId: z.string().min(1, { message: "Venture selection is required" }),
  remarks: z.string().optional(),
  items: z.array(
    z.object({
      materialId: z.string().min(1, { message: "Material is required" }),
      quantity: z.number().positive({ message: "Quantity must be positive" }),
    })
  ).min(1, { message: "Add at least one item to request" }),
});

export const StockAdjustmentSchema = z.object({
  materialId: z.string().min(1),
  ventureId: z.string().min(1),
  quantity: z.number().positive(),
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'STOCK_TRANSFER']),
  targetVentureId: z.string().optional(), // required only for STOCK_TRANSFER
  remarks: z.string().optional(),
});

export const AttendanceSchema = z.object({
  employeeId: z.string().uuid({ message: "Invalid Employee ID" }),
  date: z.string().datetime({ message: "Invalid date format" }),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE', 'FIELD_WORK'], { message: "Invalid status" }),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  location: z.string().optional(),
});

export const LeaveRequestSchema = z.object({
  employeeId: z.string().uuid({ message: "Invalid Employee ID" }),
  type: z.enum(['SICK', 'CASUAL', 'PAID', 'UNPAID'], { message: "Invalid leave type" }),
  startDate: z.string().datetime({ message: "Invalid start date format" }),
  endDate: z.string().datetime({ message: "Invalid end date format" }),
  reason: z.string().optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date cannot be earlier than start date",
  path: ["endDate"]
}).refine((data) => toCalendarDate(data.startDate) >= toCalendarDate(new Date()), {
  message: "Start date cannot be in the past",
  path: ["startDate"]
}).refine((data) => leaveDurationDays(data.startDate, data.endDate) <= MAX_LEAVE_DAYS, {
  message: `Leave cannot exceed ${MAX_LEAVE_DAYS} days in a single request`,
  path: ["endDate"]
});
