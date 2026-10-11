import { HttpError } from "./http";
export function literalSearch(value: string): string {
  if (value.length > 200) throw new HttpError("Search is too long", 400);
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function validatePage(page: number, limit: number) {
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 200) throw new HttpError("Invalid pagination",400);
}
