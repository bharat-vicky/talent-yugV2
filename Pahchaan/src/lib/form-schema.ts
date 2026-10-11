import { z } from "zod";
const text=z.string().max(10000);
const conditions=z.object({fieldId:z.string().max(100),operator:z.enum(["equals","not_equals","contains","greater_than","less_than"]),value:z.string().max(500)});
export const formFieldSchema=z.object({
 id:z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).refine(value=>!["__proto__","constructor","prototype"].includes(value)),
 type:z.enum(["text","textarea","email","phone","number","date","time","url","dropdown","radio","checkbox","multiselect","address","country","state","city","divider","heading","paragraph","html","spacer"]),
 label:z.string().min(1).max(300),placeholder:text.optional(),helpText:text.optional(),description:text.optional(),
 required:z.boolean(),hidden:z.boolean(),readOnly:z.boolean(),defaultValue:z.union([text,z.number().finite(),z.boolean(),z.array(text).max(100)]).optional(),
 width:z.enum(["full","half","third"]),options:z.array(z.string().max(500)).max(100).optional(),
 validationRules:z.object({min:z.number().finite().optional(),max:z.number().finite().optional(),minLength:z.number().int().nonnegative().max(10000).optional(),maxLength:z.number().int().nonnegative().max(10000).optional()}).strict().optional(),
 conditionalVisibility:z.object({operator:z.enum(["AND","OR"]),conditions:z.array(conditions).max(20)}).optional(),customCssClass:z.string().max(200).optional()
});
export const formSchema=z.object({
 fields:z.array(formFieldSchema).max(100).refine(fields=>new Set(fields.map(field=>field.id)).size===fields.length,"Field identifiers must be unique").optional(),
 settings:z.object({openDate:z.coerce.date().optional(),closeDate:z.coerce.date().optional(),capacity:z.number().int().nonnegative().max(1000000).optional(),allowWaitlist:z.boolean(),autoApprove:z.boolean(),duplicateEmailPolicy:z.enum(["allow","reject","update"]),duplicatePhonePolicy:z.enum(["allow","reject","update"]),generateQR:z.boolean(),createGuest:z.boolean()}).optional(),
 branding:z.object({title:text.optional(),description:text.optional(),coverImage:z.string().url().nullable().optional(),primaryColor:z.string().regex(/^#[a-fA-F0-9]{6}$/),showEventDescription:z.boolean(),showDateLocation:z.boolean(),successMessage:text.optional()}).optional()
});
