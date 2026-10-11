import type { GuestDocument } from "@/domain/types";

function csvCell(value: unknown): string {
  const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  // Prevent attendee-supplied values from becoming spreadsheet formulas.
  const safe = /^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function selectedGuestsCsv(guests: GuestDocument[], ids: ReadonlySet<string>) {
  const selected = guests.filter(guest => ids.has(String(guest._id)));
  if (!selected.length) throw new Error("Select at least one guest from the current list to export.");
  if (selected.length !== ids.size) throw new Error("The guest list has changed. Please select your guests again.");
  const customKeys = [...new Set(selected.flatMap(guest => Object.keys(guest.customData ?? {})))].sort();
  const headers = ["First Name", "Last Name", "Email", "Phone", "Title", "Organization", "Status", "Created At", ...customKeys.map(key => `Registration: ${key}`)];
  const rows = selected.map(guest => [
    guest.firstName, guest.lastName, guest.email, guest.phone, guest.title, guest.organization,
    guest.status, new Date(guest.createdAt).toISOString(),
    ...customKeys.map(key => guest.customData?.[key]),
  ]);
  return { count: selected.length, csv: "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n") };
}
