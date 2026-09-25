/**
 * Zod validation schemas for all API inputs
 * Provides type-safe validation with detailed error messages
 */

import { z } from "zod";

// Common field validations
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters");

export const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, "Phone must be 10 digits")
  .optional()
  .or(z.literal(""));

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters");

export const addressSchema = z
  .string()
  .min(5, "Address is required")
  .max(200, "Address must be less than 200 characters");

export const zipSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code");

// Enums matching Prisma schema
export const userRoleSchema = z.enum(["TECHNICIAN", "MANAGER", "ADMIN", "OWNER", "SUPER_ADMIN"]);
export const clientRoleSchema = z.enum([
  "HOMEOWNER",
  "BUYER",
  "SELLER",
  "REALTOR",
  "PROPERTY_MANAGER",
  "OTHER",
]);
export const accessTypeSchema = z.enum([
  "CLEANOUT",
  "ROOF_VENT",
  "TOILET_PULL",
  "UNKNOWN",
]);
export const inspectionStageSchema = z.enum([
  "ACCEPTED",
  "EN_ROUTE",
  "ARRIVED",
  "PRE_INSPECTION",
  "INSPECTING",
  "POST_INSPECTION",
  "VIDEO_ATTACH",
  "CLIENT_SIGNOFF",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "DELIVERED",
]);
export const conditionRatingSchema = z.enum([
  "GOOD",
  "FAIR",
  "NEEDS_ATTENTION",
  "CRITICAL",
]);
export const urgencyLevelSchema = z.enum(["NONE", "MONITOR", "SOON", "IMMEDIATE"]);
export const pipeMaterialSchema = z.enum([
  "CAST_IRON",
  "CLAY",
  "PVC",
  "ABS",
  "ORANGEBURG",
  "CONCRETE",
  "HDPE",
  "UNKNOWN",
]);
export const uploadStatusSchema = z.enum([
  "PENDING",
  "UPLOADING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: z.string().optional(),
  role: userRoleSchema.optional().default("TECHNICIAN"),
});

// Inspection schemas
export const preInspectionDataSchema = z.object({
  confirmedClientName: nameSchema,
  confirmedAddress: addressSchema,
  homeAge: z.string().max(50).optional(),
  pipeMaterial: pipeMaterialSchema.optional(),
  knownIssues: z.string().max(2000).optional(),
  backupHistory: z.string().max(2000).optional(),
  recentWork: z.string().max(2000).optional(),
  specialInstructions: z.string().max(2000).optional(),
});

export const defectEntrySchema = z.object({
  type: z.enum([
    "root_intrusion",
    "crack",
    "belly",
    "offset",
    "blockage",
    "grease",
    "corrosion",
    "collapse",
  ]),
  severity: z.enum(["minor", "moderate", "severe"]),
  location: z.string().max(100),
  notes: z.string().max(500).optional(),
});

export const postInspectionDataSchema = z.object({
  overallCondition: conditionRatingSchema,
  pipeConditionRating: z.number().int().min(1).max(5),
  connectionToMain: z.string().max(200),
  recommendations: z.string().min(10, "Recommendations must be at least 10 characters").max(5000),
  urgencyLevel: urgencyLevelSchema,
  rootIntrusion: defectEntrySchema.optional().nullable(),
  cracks: z.array(defectEntrySchema).optional().nullable(),
  bellies: z.array(defectEntrySchema).optional().nullable(),
  offsetJoints: z.array(defectEntrySchema).optional().nullable(),
  blockages: z.array(defectEntrySchema).optional().nullable(),
});

export const updateStageSchema = z.object({
  stage: inspectionStageSchema,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().positive().optional(),
});

export const videoUploadSchema = z.object({
  cloudPath: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(2 * 1024 * 1024 * 1024), // 2GB max
  mimeType: z.string().regex(/^video\//, "Must be a video file"),
  uploadId: z.string().optional(),
  uploadStatus: uploadStatusSchema,
  uploadProgress: z.number().int().min(0).max(100).optional(),
  duration: z.number().int().positive().optional(),
});

export const signatureSchema = z.object({
  signatureData: z.string().min(1, "Signature is required"),
  signerName: nameSchema,
  signerRole: clientRoleSchema,
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// Video chapter schema
export const videoChapterSchema = z.object({
  timestamp: z.number().int().min(0),
  endTimestamp: z.number().int().min(0).optional(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  chapterType: z.enum([
    "INTRO",
    "FINDING",
    "DEFECT",
    "REPAIR_NEEDED",
    "OBSERVATION",
    "CONCLUSION",
  ]),
  severity: z.enum(["INFO", "MINOR", "MODERATE", "MAJOR", "CRITICAL"]).optional(),
  includeInHighlight: z.boolean().default(true),
});

// Delivery schemas
export const verifyEmailSchema = z.object({
  email: emailSchema,
  token: z.string().min(1, "Token is required"),
});

export const createDeliveryTokenSchema = z.object({
  inspectionId: z.string().cuid(),
  clientEmail: emailSchema,
  expiresInHours: z.number().int().min(1).max(720).default(72), // Max 30 days
  downloadLimit: z.number().int().min(1).max(100).default(3),
});

// Admin schemas
export const approvalSchema = z.object({
  reviewNotes: z.string().max(2000).optional(),
});

export const rejectionSchema = z.object({
  reason: z.string().min(10, "Please provide a detailed reason").max(2000),
});

// Override request schema
export const overrideRequestSchema = z.object({
  reason: z.enum([
    "ACCESS_DENIED",
    "EQUIPMENT_MALFUNCTION",
    "PIPE_BLOCKED",
    "SAFETY_CONCERN",
    "OTHER",
  ]),
  notes: z.string().max(2000).optional(),
  skipSignature: z.boolean().optional().default(false),
});

export const overrideApprovalSchema = z.object({
  resolution: z.enum(["INCOMPLETE", "PARTIAL", "COMPLETE", "RESCHEDULE"]),
  skipSignature: z.boolean().default(false),
  adminNotes: z.string().max(2000).optional(),
});

// Job booking schemas
export const bookingSchema = z.object({
  clientName: nameSchema,
  clientEmail: emailSchema,
  clientPhone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  clientRole: clientRoleSchema.default("HOMEOWNER"),
  propertyAddress: addressSchema,
  propertyCity: z.string().min(1).max(100).default("Indianapolis"),
  propertyState: z.string().length(2).default("IN"),
  propertyZip: zipSchema,
  scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time").optional(),
  accessType: accessTypeSchema.default("CLEANOUT"),
  hasCrawlSpace: z.boolean().default(false),
  specialNotes: z.string().max(2000).optional(),
});

// Contact form schema
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
  serviceType: z.string().optional().default("general"),
});

// Type exports for use in API routes
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PreInspectionData = z.infer<typeof preInspectionDataSchema>;
export type PostInspectionData = z.infer<typeof postInspectionDataSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type VideoUploadInput = z.infer<typeof videoUploadSchema>;
export type SignatureInput = z.infer<typeof signatureSchema>;
export type VideoChapterInput = z.infer<typeof videoChapterSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type CreateDeliveryTokenInput = z.infer<typeof createDeliveryTokenSchema>;
export type ApprovalInput = z.infer<typeof approvalSchema>;
export type RejectionInput = z.infer<typeof rejectionSchema>;
export type OverrideRequestInput = z.infer<typeof overrideRequestSchema>;
export type OverrideApprovalInput = z.infer<typeof overrideApprovalSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type DefectEntry = z.infer<typeof defectEntrySchema>;

// Helper to create a validated parser for API routes
export function parseWithZod<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string; field?: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: firstError.message,
      field: firstError.path.join("."),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}
