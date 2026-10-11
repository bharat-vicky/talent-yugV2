import { ObjectId } from "mongodb";

export type Role = "owner" | "admin" | "manager" | "member" | "viewer";
export type EventStatus = "draft" | "scheduled" | "published" | "live" | "paused" | "completed" | "archived" | "cancelled";

export interface User {
  emailVerified?: Date | null;
  _id?: ObjectId | string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
  organization?: string | null;
  timezone?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Workspace {
  _id?: ObjectId | string;
  id?: string;
  name: string;
  slug: string;
  logo?: string | null;
  timezone?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
  limits?: {
    maxEvents: number;
    maxGuests: number;
    maxMembers: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  _id?: string;
  workspaceId: string;
  name: string;
  prefix: string; // e.g. "idf_live_"
  lastFour: string; // e.g. "ABCD"
  hash: string; // bcrypt hash of the token
  createdBy: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
  status: 'active' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
}

export interface Webhook {
  _id?: string;
  workspaceId: string;
  name: string;
  endpointUrl: string;
  secret: string; // Used to sign payloads
  events: string[]; // e.g. ["guest.created", "registration.submitted"]
  status: 'active' | 'failing' | 'disabled';
  lastDelivery?: Date;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Integration {
  _id?: string;
  workspaceId: string;
  provider: 'salesforce' | 'hubspot' | 'mailchimp' | 'slack';
  status: 'connected' | 'disconnected';
  credentials: Record<string, string>; // Encrypted in real life
  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  _id?: ObjectId | string;
  userId: string;
  workspaceId: string;
  role: Role;
  favoriteEventIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceInvite {
  _id?: string | ObjectId;
  workspaceId: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  token: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  _id?: ObjectId | string;
  workspaceId: string;
  name: string;
  slug: string; // Internal slug
  category?: string | null;
  uniqueSlug?: string; // Public registration slug (/r/slug)
  vanityUrl?: string | null; // Custom domain mapping
  description?: string | null;
  coverImage?: string | null;
  templateId?: string | null;
  status: EventStatus;
  venue?: string | null;
  endDate: Date;
  date: Date;
  qrSettings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateModule = 
  | "event_settings" 
  | "branding" 
  | "registration_form" 
  | "registration_settings" 
  | "qr_config" 
  | "scanner_config" 
  | "guest_config" 
  | "notification_config" 
  | "badge_config";

export type TemplateVisibility = "private" | "workspace" | "public";

export interface MarketplaceMetadata {
  publisher?: string;
  version?: string;
  downloads?: number;
  rating?: number;
  featured?: boolean;
  verified?: boolean;
  license?: string;
}

export interface EventTemplate {
  _id?: ObjectId | string;
  workspaceId?: string | null; // null for official/system templates
  name: string;
  description: string;
  category: string;
  thumbnail?: string | null;
  coverImage?: string | null;
  tags?: string[];
  visibility: TemplateVisibility;
  status: "draft" | "published" | "archived";
  isOfficial: boolean;
  createdBy: string;
  updatedBy?: string;
  favoriteCount: number;
  usageCount: number;
  lastUsedAt?: Date | null;
  modules: TemplateModule[];
  settingsSnapshot?: {
    event?: Partial<EventSettings>;
    branding?: Partial<BrandingSettings>;
    registration?: Partial<RegistrationSettings>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registrationForm?: any; // any to avoid circular referencing issues, though interfaces hoist
    scanner?: Partial<ScannerSettings>;
    qr?: Partial<QRConfiguration>;
    guest?: Partial<GuestConfiguration>;
    notification?: Partial<NotificationSettings>;
  };
  marketplace?: MarketplaceMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceSettings {
  _id?: ObjectId | string;
  workspaceId: string;
  theme: "system" | "light" | "dark";
  accentColor: string;
  features: string[];
  updatedAt: Date;
}

export interface EventSettings {
  _id?: ObjectId | string;
  eventId: string;
  workspaceId: string;
  isPublic: boolean;
  maxCapacity?: number;
  updatedAt: Date;
}

export interface BrandingSettings {
  _id?: ObjectId | string;
  workspaceId: string;
  eventId?: string;
  primaryColor: string;
  logo?: string | null;
  updatedAt: Date;
}

export interface ScannerSettings {
  _id?: ObjectId | string;
  workspaceId: string;
  eventId?: string;
  offlineEnabled: boolean;
  autoSync: boolean;
  updatedAt: Date;
}

export interface RegistrationSettings {
  _id?: ObjectId | string;
  workspaceId: string;
  eventId?: string;
  requireApproval: boolean;
  allowWaitlist: boolean;
  updatedAt: Date;
}

export interface QRConfiguration {
  _id?: ObjectId | string;
  workspaceId: string;
  eventId?: string;
  style: string;
  fgColor: string;
  bgColor: string;
  updatedAt: Date;
}

export interface GuestConfiguration {
  _id?: ObjectId | string;
  workspaceId: string;
  eventId?: string;
  collectPhone: boolean;
  collectOrganization: boolean;
  customFields: string[];
  updatedAt: Date;
}

export type NotificationType = 
  | "registration" 
  | "qr_scanned" 
  | "report_exported" 
  | "guests_imported" 
  | "qr_generated" 
  | "invitation_sent" 
  | "system";

export interface EventNotification {
  _id?: ObjectId | string;
  eventId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  message: string;
  details?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

export interface NotificationSettings {
  _id?: ObjectId | string;
  workspaceId: string;
  eventId?: string;
  emailAlerts: boolean;
  dailyDigest: boolean;
  webhookUrl?: string | null;
  showDashboardBadge?: boolean;
  notifyOnRegistration?: boolean;
  notifyOnScan?: boolean;
  notifyOnExport?: boolean;
  notifyOnImport?: boolean;
  notifyOnQRGen?: boolean;
  updatedAt: Date;
}

export interface AuditLog {
  _id?: ObjectId | string;
  workspaceId?: string;
  userId: string;
  action: string;
  details: unknown;
  createdAt: Date;
}

// ==========================================
// Phase 4: QR Design Studio Types
// ==========================================

export type QRStatus = "active" | "published" | "draft" | "disabled" | "archived";

export interface QRCodeDesignOptions {
  shape?: "square" | "circle";
  width?: number;
  height?: number;
  data?: string;
  margin?: number;
  qrOptions?: {
    typeNumber?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40;
    mode?: "Numeric" | "Alphanumeric" | "Byte" | "Kanji";
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  };
  imageOptions?: {
    hideBackgroundDots?: boolean;
    imageSize?: number;
    margin?: number;
    crossOrigin?: string;
    logoShape?: "square" | "circle" | "diamond";
  };
  originalImage?: string;
  dotsOptions?: {
    type?: "rounded" | "dots" | "classy" | "classy-rounded" | "square" | "extra-rounded";
    color?: string;
    gradient?: {
      type: "linear" | "radial";
      rotation?: number;
      colorStops: Array<{ offset: number; color: string }>;
    };
  };
  backgroundOptions?: {
    color?: string;
    gradient?: {
      type: "linear" | "radial";
      rotation?: number;
      colorStops: Array<{ offset: number; color: string }>;
    };
  };
  cornersSquareOptions?: {
    type?: "dot" | "square" | "extra-rounded";
    color?: string;
  };
  cornersDotOptions?: {
    type?: "dot" | "square";
    color?: string;
  };
  image?: string;
}

export type QRGenerationType = "single" | "bulk_sequential" | "csv_import" | "guest_badge" | "ticket_batch";

export interface QRCodeDocument {
  _id?: ObjectId | string;
  shortId: string;
  workspaceId: string;
  eventId: string;
  name: string;
  description?: string;
  category?: string;
  destinationUrl?: string; // If static/dynamic
  isDynamic: boolean;
  status: QRStatus;
  design: QRCodeDesignOptions;
  scanCount: number;
  analytics?: {
    uniqueScans: number;
    scansByDevice: Record<string, number>;
    scansByBrowser: Record<string, number>;
    scansByCountry: Record<string, number>;
    scansByCity: Record<string, number>;
    scansByReferrer: Record<string, number>;
    scansByUTM: Record<string, number>;
    timeSeries: Array<{ date: string; count: number }>;
  };
  createdAt: Date;
  updatedAt: Date;

  // Bulk Generation Fields
  batchId?: string;
  generationType?: QRGenerationType;
  createdFromTemplate?: string;
  sequence?: string;
  metadata?: Record<string, unknown>;
}

export interface QRVersion {
  _id?: ObjectId | string;
  qrId: string;
  workspaceId: string;
  eventId: string;
  design: QRCodeDesignOptions;
  authorId: string;
  changeSummary?: string;
  createdAt: Date;
}

export interface QRTemplate {
  _id?: ObjectId | string;
  workspaceId?: string; // null if system template
  name: string;
  description?: string;
  category?: string;
  isSystem: boolean;
  design: QRCodeDesignOptions;
  createdAt: Date;
  updatedAt: Date;
}

export interface QRDownload {
  _id?: ObjectId | string;
  qrId?: string;
  batchId?: string;
  workspaceId: string;
  eventId: string;
  format: string;
  resolution?: number;
  userId: string;
  ip?: string;
  createdAt: Date;
}

// ==========================================
// Phase 5: Enterprise Guest Management
// ==========================================

export type GuestStatus = 
  | "draft"
  | "pending"
  | "registered"
  | "approved"
  | "rejected"
  | "invited"
  | "checked_in"
  | "checked_out"
  | "completed"
  | "cancelled"
  | "archived";

export interface GuestGroup {
  _id?: ObjectId | string;
  workspaceId: string;
  eventId: string;
  name: string;
  description?: string;
  color: string;
  capacity?: number;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckInRecord {
  timestamp: Date;
  method: "manual" | "qr_scan" | "nfc" | "rfid";
  direction: "in" | "out";
  scannerId?: string;
  deviceId?: string;
  operatorId?: string;
  location?: string;
  status: "success" | "denied" | "flagged";
  reason?: string;
}

export interface TimelineEvent {
  _id?: ObjectId | string;
  type: 
    | "created" 
    | "registration_submitted" 
    | "registration_approved"
    | "registration_rejected"
    | "qr_generated"
    | "qr_assigned"
    | "invitation_sent"
    | "badge_printed"
    | "checked_in"
    | "checked_out"
    | "notes_added"
    | "profile_updated";
  title: string;
  description?: string;
  actorId?: string; // User who did this
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface GuestDocument {
  _id?: ObjectId | string;
  workspaceId: string;
  eventId: string;
  
  // Profile
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  organization?: string;
  title?: string;
  
  // Custom Fields (Mapped by Registration Settings)
  customData?: Record<string, unknown>;
  
  // Status & Groups
  status: GuestStatus;
  groupIds: string[];
  tags: string[];
  
  // Relationships
  qrCodeId?: string; // Reference to Phase 4 QRCodeDocument
  
  // Metrics & Tracking
  checkIns: CheckInRecord[];
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Phase 7: Enterprise Registration & Form Builder
// ==========================================

export type FormFieldType = 
  | "text" | "textarea" | "email" | "phone" | "number" | "date" | "time" | "url"
  | "dropdown" | "radio" | "checkbox" | "multiselect"
  | "address" | "country" | "state" | "city" | "fileupload" | "imageupload" | "signature"
  | "divider" | "heading" | "paragraph" | "html" | "spacer";

export interface FormFieldCondition {
  fieldId: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: string;
}

export interface FormField {
  id: string; // Unique ID within the form
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  description?: string;
  required: boolean;
  hidden: boolean;
  readOnly: boolean;
  defaultValue?: unknown;
  width: "full" | "half" | "third";
  options?: string[]; // For dropdowns, radios, etc.
  validationRules?: Record<string, unknown>;
  conditionalVisibility?: {
    operator: "AND" | "OR";
    conditions: FormFieldCondition[];
  };
  customCssClass?: string;
}

export interface RegistrationForm {
  _id?: ObjectId | string;
  workspaceId: string;
  eventId: string;
  fields: FormField[];
  settings: {
    openDate?: Date;
    closeDate?: Date;
    capacity?: number;
    allowWaitlist: boolean;
    autoApprove: boolean;
    duplicateEmailPolicy: "allow" | "reject" | "update";
    duplicatePhonePolicy: "allow" | "reject" | "update";
    generateQR: boolean;
    createGuest: boolean;
  };
  branding: {
    title?: string;
    description?: string;
    coverImage?: string | null;
    primaryColor: string;
    showEventDescription: boolean;
    showDateLocation: boolean;
    successMessage?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type RegistrationStatus = "pending" | "approved" | "rejected" | "waitlisted";

export interface RegistrationSubmission {
  emailVerifiedAt?: Date;
  idempotencyKey?: string;
  requestHash?: string;
  _id?: ObjectId | string;
  workspaceId: string;
  eventId: string;
  formId: string;
  guestId?: string; // Set once approved and provisioned
  status: RegistrationStatus;
  answers: Record<string, unknown>; // Keyed by field.id
  deviceMetadata?: {
    userAgent: string;
    ip?: string;
    referrer?: string;
    utmSource?: string;
  };
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Operator ID
}
