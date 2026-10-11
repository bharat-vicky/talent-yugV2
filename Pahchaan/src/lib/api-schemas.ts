import {z} from "zod";
import {formFieldSchema} from "./form-schema";
const id=z.string().regex(/^[a-fA-F0-9]{24}$/),name=z.string().trim().min(1).max(300),text=z.string().max(10000);
const design=z.record(z.unknown());
const format=z.enum(["png","svg","pdf","jpeg","jpg","zip","webp","pdf_a4","pdf_sticker"]);
const qrUpdates=z.object({name:name.optional(),description:text.optional(),category:text.optional(),destinationUrl:z.string().url().optional(),design:design.optional(),status:z.enum(["draft","active","published","disabled","archived"]).optional()});
export const apiSchemas={
 active:z.object({workspaceId:id}),
 key:z.object({name}),
 webhook:z.object({name,endpointUrl:z.string().url().max(2000),events:z.array(z.string().min(1).max(100)).min(1).max(50)}),
 scan:z.object({qrData:z.string().max(10000).optional(),guestId:id.optional(),direction:z.enum(["in","out"]).default("in"),location:z.string().max(300).optional()}),
 qr:qrUpdates.extend({name,isDynamic:z.boolean().default(true)}),
 qrUpdate:z.object({updates:qrUpdates,saveVersion:z.boolean().optional(),versionSummary:z.string().max(300).optional()}),
 version:z.object({versionId:id,action:z.literal("restore")}),
 download:z.object({format,resolution:z.number().int().positive().max(10000).optional()}),
 batch:z.object({name:name.default("Bulk QR"),design:design.default({}),options:z.object({quantity:z.number().int().positive().max(1000),prefix:z.string().max(100).optional(),startNumber:z.number().int().nonnegative().max(1000000).optional(),padding:z.number().int().nonnegative().max(20).optional()}),destinationUrlBase:z.string().url().optional()}),
 template:z.object({name,description:text.optional(),design}),
 templateUpdate:z.object({name:name.optional(),description:text.optional(),design:design.optional()}),
 preset:z.object({name,category:name.default("Custom"),description:text.default(""),fields:z.array(formFieldSchema).max(100).default([]),branding:z.record(z.unknown()).optional()}),
 bulkGuests:z.object({guestIds:z.array(id).max(1000).optional(),status:z.enum(["approved","pending","rejected","cancelled","archived"]).optional()}).passthrough(),
 notify:z.object({guestIds:z.array(id).min(1).max(100),attachment:z.string().max(7000000).optional(),customMessage:text.optional()}),
 feed:z.object({action:z.enum(["mark_read","mark_all_read","delete","clear_all"]),id:id.optional()}),
 activity:z.object({type:z.enum(["registration","qr_scanned","report_exported","guests_imported","qr_generated","invitation_sent","system"]),title:name,message:text,details:z.record(z.unknown()).default({})}),
 event:z.object({workspaceId:id,name:name.optional(),slug:z.string().max(200).optional(),description:text.optional(),category:text.optional(),date:z.coerce.date().optional(),endDate:z.coerce.date().optional(),venue:text.optional(),maxCapacity:z.number().int().nonnegative().max(1000000).optional(),status:z.enum(["draft","scheduled","published","live","paused","completed","archived","cancelled"]).optional()})
};

