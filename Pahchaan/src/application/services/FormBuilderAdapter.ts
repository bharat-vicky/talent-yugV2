import { FormField } from "@/domain/types";

export interface FormBuilderAdapter {
  fields: FormField[];
  addField(field: Omit<FormField, "id">): void;
  removeField(id: string): void;
  updateField(id: string, updates: Partial<FormField>): void;
  reorderFields(oldIndex: number, newIndex: number): void;
}
