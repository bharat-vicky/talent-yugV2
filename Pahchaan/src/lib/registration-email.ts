import type { FormField } from "@/domain/types";

export function registrationEmailFields(fields: FormField[]): FormField[] {
  const primaryEmail = fields.findIndex(field => field.type === "email");
  if (primaryEmail >= 0) return fields.map((field, index) => index === primaryEmail
    ? {...field, required: true, hidden: false, readOnly: false, conditionalVisibility: undefined}
    : field);
  return [...fields, { id: "attendee_verification_email", type: "email", label: "Email address", required: true, hidden: false, readOnly: false, width: "full" }];
}
