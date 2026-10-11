import { z } from "zod";
import type { Event, FormField, RegistrationForm } from "@/domain/types";

export class RegistrationError extends Error {
  constructor(message: string, public readonly status: number = 400) { super(message); }
}

export function assertRegistrationOpen(event: Event, form?: RegistrationForm): void {
  if (!["published", "live"].includes(event.status)) throw new RegistrationError("Registration unavailable", 404);
  const now = Date.now();
  if (form?.settings.openDate && new Date(form.settings.openDate).getTime() > now) throw new RegistrationError("Registration has not opened", 403);
  if (form?.settings.closeDate && new Date(form.settings.closeDate).getTime() < now) throw new RegistrationError("Registration has closed", 403);
}

export function isFieldVisible(field: FormField, answers: Record<string, unknown>): boolean {
  if (field.hidden) return false;
  const visibility = field.conditionalVisibility;
  if (!visibility?.conditions.length) return true;
  const matches = visibility.conditions.map(condition => {
    const value = String(answers[condition.fieldId] ?? "");
    switch (condition.operator) {
      case "equals": return value === condition.value;
      case "not_equals": return value !== condition.value;
      case "contains": return value.includes(condition.value);
      case "greater_than": return Number(value) > Number(condition.value);
      case "less_than": return Number(value) < Number(condition.value);
    }
  });
  return visibility.operator === "OR" ? matches.some(Boolean) : matches.every(Boolean);
}

export function validateRegistrationAnswers(fields: FormField[], answers: Record<string, unknown>): Record<string, unknown> {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) throw new RegistrationError("Invalid answers");
  const ids = new Set(fields.map(field => field.id));
  if (Object.keys(answers).some(key => !ids.has(key) || key.includes(".") || key.startsWith("$") || ["__proto__", "constructor", "prototype"].includes(key))) throw new RegistrationError("Unknown answer field");
  answers = { ...answers };
  for (const field of fields) {
    if (field.readOnly || field.hidden) {
      delete answers[field.id];
      if (field.defaultValue !== undefined) answers[field.id] = field.defaultValue;
    } else if (answers[field.id] === undefined && field.defaultValue !== undefined) answers[field.id] = field.defaultValue;
  }
  const layoutTypes = new Set(["divider", "heading", "paragraph", "html", "spacer"]);
  for (const field of fields) {
    if (layoutTypes.has(field.type) || !isFieldVisible(field, answers)) continue;
    const value = answers[field.id];
    const empty = value === undefined || value === null || value === "" || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length);
    if (empty) {
      if (field.required) throw new RegistrationError(`${field.label} is required`);
      continue;
    }
    if (field.type === "email" && (typeof value !== "string" || !z.string().email().max(254).safeParse(value.trim()).success)) throw new RegistrationError(`${field.label} must be a valid email`);
    if (typeof value === "string" && value.length > 10000) throw new RegistrationError(`${field.label} is too long`);
    if (field.type === "number" && !Number.isFinite(Number(value))) throw new RegistrationError(`${field.label} must be a number`);
    if (["text", "textarea", "phone", "url", "date", "time", "email"].includes(field.type) && typeof value !== "string") throw new RegistrationError(`${field.label} must be text`);
    if (["dropdown", "radio", "country", "state"].includes(field.type) && (typeof value !== "string" || field.options?.length && !field.options.includes(value))) throw new RegistrationError(`${field.label} has an invalid option`);
    if (field.type === "multiselect" && (!Array.isArray(value) || value.length > 100 || value.some(item => typeof item !== "string" || !field.options?.includes(item)))) throw new RegistrationError(`${field.label} has invalid selections`);
    if (field.type === "checkbox" && ![true, false, "true", ""].includes(value as boolean | string)) throw new RegistrationError(`${field.label} must be a checkbox`);
    if (field.type === "checkbox" && field.required && value !== true && value !== "true") throw new RegistrationError(`${field.label} is required`);
    if (["address", "city"].includes(field.type) && typeof value !== "string") throw new RegistrationError(`${field.label} must be text`);
    if (field.type === "phone" && !/^\+?[\d ()-]{7,25}$/.test(String(value))) throw new RegistrationError(`${field.label} must be a phone number`);
    if (field.type === "url" && !z.string().url().refine(url => ["https:", "http:"].includes(new URL(url).protocol)).safeParse(value).success) throw new RegistrationError(`${field.label} must be a web URL`);
    if (field.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || !Number.isFinite(Date.parse(String(value))) || new Date(String(value)).toISOString().slice(0,10) !== value)) throw new RegistrationError(`${field.label} must be a valid date`);
    if (field.type === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value))) throw new RegistrationError(`${field.label} must be a valid time`);
    // Public uploads require a dedicated malware-scanned upload flow; do not accept arbitrary paths or URLs.
    if (["fileupload", "imageupload", "signature"].includes(field.type)) throw new RegistrationError(`${field.label} uploads are not enabled yet`);
    const rules = field.validationRules;
    if (rules) {
      if (typeof rules.minLength === "number" && String(value).length < rules.minLength || typeof rules.maxLength === "number" && String(value).length > rules.maxLength) throw new RegistrationError(`${field.label} has an invalid length`);
      if (field.type === "number" && (typeof rules.min === "number" && Number(value) < rules.min || typeof rules.max === "number" && Number(value) > rules.max)) throw new RegistrationError(`${field.label} is outside its allowed range`);
      if (rules.pattern) throw new RegistrationError(`${field.label} uses an unsupported validation pattern`);
    }
  }
  return answers;
}
