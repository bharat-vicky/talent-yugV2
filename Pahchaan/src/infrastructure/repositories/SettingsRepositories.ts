import { MongoRepository } from "./MongoRepository";
import { WorkspaceSettings, EventSettings, BrandingSettings, ScannerSettings, RegistrationSettings, QRConfiguration, GuestConfiguration, NotificationSettings } from "@/domain/types";

export class WorkspaceSettingsRepository extends MongoRepository<WorkspaceSettings> {
  constructor() { super("workspace_settings"); }
}
export const workspaceSettingsRepository = new WorkspaceSettingsRepository();

export class EventSettingsRepository extends MongoRepository<EventSettings> {
  constructor() { super("event_settings"); }
}
export const eventSettingsRepository = new EventSettingsRepository();

export class BrandingSettingsRepository extends MongoRepository<BrandingSettings> {
  constructor() { super("branding_settings"); }
}
export const brandingSettingsRepository = new BrandingSettingsRepository();

export class ScannerSettingsRepository extends MongoRepository<ScannerSettings> {
  constructor() { super("scanner_settings"); }
}
export const scannerSettingsRepository = new ScannerSettingsRepository();

export class RegistrationSettingsRepository extends MongoRepository<RegistrationSettings> {
  constructor() { super("registration_settings"); }
}
export const registrationSettingsRepository = new RegistrationSettingsRepository();

export class QRConfigurationRepository extends MongoRepository<QRConfiguration> {
  constructor() { super("qr_configurations"); }
}
export const qrConfigurationRepository = new QRConfigurationRepository();

export class GuestConfigurationRepository extends MongoRepository<GuestConfiguration> {
  constructor() { super("guest_configurations"); }
}
export const guestConfigurationRepository = new GuestConfigurationRepository();

export class NotificationSettingsRepository extends MongoRepository<NotificationSettings> {
  constructor() { super("notification_settings"); }
}
export const notificationSettingsRepository = new NotificationSettingsRepository();
