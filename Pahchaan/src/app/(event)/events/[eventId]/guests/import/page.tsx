/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, use } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { 
  Upload, 
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { GuestStatus } from "@/domain/types";

const STEPS = ["Upload File", "Map Columns", "Preview & Import"];

interface MappedData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  title: string;
  status: GuestStatus;
}

interface FieldDef {
  key: keyof Omit<MappedData, "status">;
  label: string;
  required: boolean;
  desc: string;
  icon: any;
}

const IMPORT_FIELDS: FieldDef[] = [
  { key: "firstName", label: "First Name", required: true, desc: "Given or full name", icon: User },
  { key: "lastName", label: "Last Name", required: false, desc: "Family or surname", icon: User },
  { key: "email", label: "Email Address", required: true, desc: "Primary contact for QR badge delivery", icon: Mail },
  { key: "phone", label: "Phone Number", required: false, desc: "Mobile / SMS contact", icon: Phone },
  { key: "title", label: "Role / Title", required: false, desc: "Job title or position (e.g. Speaker, VIP, Engineer)", icon: Briefcase },
  { key: "organization", label: "Company / Organization", required: false, desc: "Company, employer, or community", icon: Building2 },
];

export default function GuestImportPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  
  // Column Mapping State
  const [mapping, setMapping] = useState<{ [key: string]: string }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    organization: ""
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const ext = uploadedFile.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'csv') {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setHeaders(results.meta.fields || []);
          setRawData(results.data);
          autoMapColumns(results.meta.fields || []);
          setCurrentStep(1);
        },
        error: (error: unknown) => toast.error(`Error parsing CSV: ${(error as Error).message || "Parse error"}`)
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (data.length > 0) {
          const h = data[0] as string[];
          const rows = data.slice(1).map((row: unknown) => {
            const obj: Record<string, unknown> = {};
            h.forEach((header, i) => obj[header] = (row as unknown[])[i]);
            return obj;
          });
          setHeaders(h);
          setRawData(rows);
          autoMapColumns(h);
          setCurrentStep(1);
        }
      };
      reader.readAsBinaryString(uploadedFile);
    } else {
      toast.error("Unsupported file format. Please upload CSV or Excel.");
    }
  };

  const autoMapColumns = (csvHeaders: string[]) => {
    const defaultMapping: Record<string, string> = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      organization: ""
    };

    csvHeaders.forEach(h => {
      const lower = h.toLowerCase().trim().replace(/[-_]/g, ' ');
      if (lower.includes("first") && lower.includes("name")) defaultMapping.firstName = h;
      else if (lower.includes("last") && lower.includes("name")) defaultMapping.lastName = h;
      else if (lower === "name" || lower === "full name" || lower === "fullname") defaultMapping.firstName = h;
      else if (lower.includes("email") || lower.includes("mail")) defaultMapping.email = h;
      else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("tel") || lower.includes("contact") || lower.includes("cell")) defaultMapping.phone = h;
      else if (lower.includes("role") || lower.includes("title") || lower.includes("job") || lower.includes("position") || lower.includes("designation")) defaultMapping.title = h;
      else if (lower.includes("company") || lower.includes("organization") || lower.includes("org") || lower.includes("business") || lower.includes("corp") || lower.includes("firm")) defaultMapping.organization = h;
    });

    setMapping(defaultMapping);
  };

  const [importStatus, setImportStatus] = useState<GuestStatus>("approved");

  const handleImport = async () => {
    setIsProcessing(true);
    
    // Transform data based on mapping
    const guestsToImport: MappedData[] = rawData.map(row => {
      return {
        firstName: row[mapping.firstName] || "",
        lastName: row[mapping.lastName] || "",
        email: row[mapping.email] || "",
        phone: row[mapping.phone] || "",
        organization: row[mapping.organization] || "",
        title: row[mapping.title] || "",
        status: importStatus
      };
    }).filter(g => g.firstName || g.email); // Basic validation

    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: guestsToImport })
      });
      const data = await res.json();
      
      if (data.success) {
        setImportResult({ success: data.data.inserted, failed: 0 });
        toast.success(`Successfully imported ${data.data.inserted} guests in real-time!`);
      } else {
        throw new Error(data.error);
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to import guests");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/events/${eventId}/guests`}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Guests</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload CSV or Excel files to bulk import attendees with full detail mapping.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8 bg-card rounded-2xl border border-border p-4 shadow-sm">
        {STEPS.map((step, idx) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
              currentStep === idx 
                ? 'bg-primary text-primary-foreground'
                : currentStep > idx
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {currentStep > idx ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : idx + 1}
            </div>
            <span className={`ml-3 text-sm font-medium ${
              currentStep === idx ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step}
            </span>
            {idx < STEPS.length - 1 && (
              <div className="w-12 h-px bg-border mx-4" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        {currentStep === 0 && (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl bg-muted/10">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">Upload Attendees File</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm text-center">
              Drag and drop your CSV or Excel file containing guest names, emails, phone numbers, roles, and company details.
            </p>
            
            <div className="flex items-center justify-center">
              <div className="relative">
                <Button size="lg" className="rounded-xl font-semibold shadow-sm px-8">
                  Browse Files
                </Button>
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 text-foreground p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
              <div>
                <h4 className="font-semibold text-sm">Review & Map Guest Columns</h4>
                <p className="text-sm mt-0.5 text-muted-foreground">We&apos;ve auto-matched your columns. Review the mappings below to ensure Phone, Role/Title, and Company fields are mapped accurately.</p>
              </div>
            </div>

            <div className="grid gap-3.5">
              {IMPORT_FIELDS.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key} className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 p-4 border border-border/80 bg-muted/10 rounded-xl hover:border-border transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-background border border-border/60 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          {field.label}
                          {field.required && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-red-500 bg-red-500/10">Required</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{field.desc}</div>
                      </div>
                    </div>

                    <select 
                      className="w-full h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-primary cursor-pointer"
                      value={mapping[field.key] || ""}
                      onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    >
                      <option value="">-- Ignore / Not in file --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>
                          Column: &quot;{h}&quot;
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(0)} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={() => setCurrentStep(2)} className="rounded-xl font-semibold">
                Continue to Preview <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {importResult ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold">Import Complete!</h2>
                <p className="text-muted-foreground mt-2">
                  Successfully imported <span className="font-semibold text-foreground">{importResult.success}</span> guests with phone numbers, job titles, and company details into your event.
                </p>
                <div className="mt-8 flex gap-4">
                  <Button variant="outline" className="rounded-xl" onClick={() => {
                    setCurrentStep(0);
                    setFile(null);
                    setImportResult(null);
                  }}>Import Another File</Button>
                  <Link href={`/events/${eventId}/guests`}>
                    <Button className="rounded-xl font-semibold">
                      View Guest Library
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-3">
                  <div>
                    <h3 className="text-lg font-bold">Ready to Import</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {rawData.length} guests will be imported into the Guest Library.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} className="rounded-xl">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Edit Mapping
                    </Button>
                    <Button onClick={handleImport} disabled={isProcessing} className="rounded-xl font-semibold">
                      {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      {isProcessing ? "Importing..." : "Run Import"}
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                      <tr>
                        <th className="px-4 py-3">First Name</th>
                        <th className="px-4 py-3">Last Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Role / Title</th>
                        <th className="px-4 py-3">Company</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rawData.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium text-foreground">{row[mapping.firstName] || "—"}</td>
                          <td className="px-4 py-3">{row[mapping.lastName] || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{row[mapping.email] || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{row[mapping.phone] || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{row[mapping.title] || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{row[mapping.organization] || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground text-center">Showing preview of first 10 rows from file</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
