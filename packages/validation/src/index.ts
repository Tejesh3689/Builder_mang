import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const EmployeeSchema = z.object({
  firstName: z.string().min(2, { message: "First name is too short" }),
  lastName: z.string().min(2, { message: "Last name is too short" }),
  email: z.string().email({ message: "Invalid email address" }),
  employeeId: z.string().min(3, { message: "Employee ID is required" }),
  designation: z.string().min(2, { message: "Designation is required" }),
  department: z.string().min(2, { message: "Department is required" }),
  ventureIds: z.array(z.string()).min(1, { message: "Assign at least one venture" }),
});

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
