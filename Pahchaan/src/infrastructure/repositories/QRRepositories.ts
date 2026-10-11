import { MongoRepository } from "./MongoRepository";
import { QRCodeDocument, QRVersion, QRTemplate, QRDownload } from "@/domain/types";

export class QRCodeRepository extends MongoRepository<QRCodeDocument> {
  constructor() { super("qr_codes"); }
}
export const qrCodeRepository = new QRCodeRepository();

export class QRVersionRepository extends MongoRepository<QRVersion> {
  constructor() { super("qr_versions"); }
}
export const qrVersionRepository = new QRVersionRepository();

export class QRTemplateRepository extends MongoRepository<QRTemplate> {
  constructor() { super("qr_templates"); }
}
export const qrTemplateRepository = new QRTemplateRepository();

export class QRDownloadRepository extends MongoRepository<QRDownload> {
  constructor() { super("qr_downloads"); }
}
export const qrDownloadRepository = new QRDownloadRepository();

