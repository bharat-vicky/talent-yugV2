"use client";

import { use, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ChevronRight, ChevronDown, Calendar, MapPin, Info } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { isFieldVisible } from "@/lib/registration-validation";

export default function PublicRegistrationPage({ params }: { params: Promise<{ slug: string | string[] }> }) {
  const resolvedParams = use(params);
  const rawSlug = resolvedParams.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug.join('/') : rawSlug;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [event, setEvent] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<{
    fields?: import("@/domain/types").FormField[];
    branding?: {
      title?: string;
      description?: string;
      coverImage?: string | null;
      primaryColor?: string;
      showEventDescription?: boolean;
      showDateLocation?: boolean;
      successMessage?: string;
    };
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const retryKey = useRef("");

  useEffect(() => {
    fetch(`/pahchaan/api/r/${encodeURIComponent(slug)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setEvent(data.event);
        setForm(data.form);
        setAnswers(Object.fromEntries((data.form.fields || []).filter((field: import("@/domain/types").FormField) => field.defaultValue !== undefined).map((field: import("@/domain/types").FormField) => [field.id, field.defaultValue])));
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load registration form");
        setLoading(false);
      });
  }, [slug]);

  const validateField = (fieldId: string, value: string, type: string) => {
    if (!value) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
      return true;
    }
    
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, [fieldId]: "Please enter a valid email address (e.g., name@example.com)" }));
        return false;
      }
    } else if (type === "phone") {
      const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
      if (!phoneRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, [fieldId]: "Please enter a valid phone number" }));
        return false;
      }
    }
    
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    return true;
  };

  const handleFieldChange = (fieldId: string, value: string, type: string) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
    validateField(fieldId, value, type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Run validation on all fields before submitting
    let hasErrors = false;
    if (form?.fields) {
      form.fields.filter(f => isFieldVisible(f, answers)).forEach(f => {
        const val = typeof answers[f.id] === "string" ? answers[f.id] as string : "";
        if (!validateField(f.id, val, f.type)) {
          hasErrors = true;
        }
      });
    }

    if (hasErrors || Object.keys(fieldErrors).length > 0) {
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/pahchaan/api/r/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": retryKey.current || (retryKey.current = crypto.randomUUID()) },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Submission failed");
      
      setSuccess(true);
      if (data.status === "approved") {
        toast.success("Registration Approved!");
      } else {
        toast.success("Registration Submitted!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-800" /></div>;
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center relative">
        <div className="bg-white border border-zinc-200 shadow-xl rounded-3xl p-8 sm:p-10 max-w-lg w-full flex flex-col items-center overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center mb-4 text-zinc-600">
            <Calendar className="w-7 h-7 text-zinc-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-zinc-900">Registration Unavailable</h1>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm">
            The event <code className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-800 font-mono text-xs break-all">{slug}</code> was not found or the registration link may be incorrect.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <Button variant="outline" className="w-full h-11 rounded-xl border-zinc-200 hover:bg-zinc-100 cursor-pointer text-sm font-medium" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button className="w-full h-11 rounded-xl font-semibold bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer text-sm" onClick={() => window.location.href = "/pahchaan/events"}>
              View All Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        {/* Subtle Ambient Vignette */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-zinc-100 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white border border-zinc-200 shadow-xl rounded-[2.5rem] p-12 max-w-lg w-full flex flex-col items-center relative z-10"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-zinc-900 text-white rounded-full flex items-center justify-center mb-8 shadow-sm"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-4 text-zinc-900">{form?.branding?.successMessage || "Registration Complete"}</h1>
          <p className="text-zinc-600 mb-10 text-base leading-relaxed">
            Thank you for registering for <span className="text-zinc-900 font-semibold">{event?.name as string}</span>. We&apos;ve received your information securely.
          </p>
          <Button className="w-full h-14 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 text-base font-semibold transition-colors shadow-sm" onClick={() => window.location.reload()}>
            Register Another Guest
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 selection:bg-zinc-200 py-8 px-4 sm:px-6 relative overflow-x-hidden">
      
      {/* Background Subtle Monochrome Grid Pattern */}
      <div 
        className="fixed inset-0 z-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(to right, #e4e4e7 1px, transparent 1px), linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="max-w-2xl mx-auto relative z-20">
        
        {/* Sleek Top Brand Header */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-zinc-900 text-white rounded-lg flex items-center justify-center font-black text-xs">
              I
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-900">PAHCHAAN</span>
          </div>
          <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-widest bg-zinc-200/60 px-2.5 py-1 rounded-full">
            OFFICIAL REGISTRATION
          </span>
        </div>

        {/* Clean Form Card Container */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white border border-zinc-200/90 rounded-[2rem] shadow-lg overflow-hidden"
        >
          {/* Header Section */}
          <div className="p-6 sm:p-10 border-b border-zinc-100 relative overflow-hidden bg-gradient-to-b from-zinc-50/80 to-white">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-zinc-900 relative z-10 break-words [overflow-wrap:anywhere]"
            >
              {(form?.branding?.title as string) || (event?.name as string)}
            </motion.h1>
            
            {form?.branding?.showDateLocation !== false && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-zinc-600 font-medium relative z-10 flex-wrap"
              >
                {!!event?.date && (
                  <div className="flex items-center gap-2 bg-zinc-100/80 px-3.5 py-1.5 rounded-full border border-zinc-200/80">
                    <Calendar className="w-4 h-4 text-zinc-700" />
                    <span>{new Date(event.date as string).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
                {!!event?.venue && (
                  <div className="flex items-center gap-2 bg-zinc-100/80 px-3.5 py-1.5 rounded-full border border-zinc-200/80">
                    <MapPin className="w-4 h-4 text-zinc-700" />
                    <span>{event.venue as string}</span>
                  </div>
                )}
              </motion.div>
            )}
            
            {!!(form?.branding?.showEventDescription !== false && (form?.branding?.description || event?.description)) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-5 p-5 bg-zinc-50/80 border border-zinc-200/70 rounded-2xl flex flex-col gap-2 relative z-10"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <Info className="w-3.5 h-3.5 text-zinc-700" />
                  <span>About This Event & Form</span>
                </div>
                <p className="text-zinc-700 text-sm sm:text-base leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-line">
                  {(form?.branding?.description as string) || (event?.description as string)}
                </p>
              </motion.div>
            )}
          </div>

          {/* Form Section */}
          <div className="p-6 md:p-10">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col gap-5">
                {Array.isArray(form?.fields) && form.fields.map((field: import("@/domain/types").FormField, index: number) => {
                  if (!isFieldVisible(field, answers)) return null;

                  const isFocused = focusedFieldId === field.id;

                  return (
                    <motion.div 
                      key={field.id} 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + (index * 0.04), duration: 0.3 }}
                      onFocus={() => setFocusedFieldId(field.id)}
                      onClick={() => setFocusedFieldId(field.id)}
                      className={`w-full p-6 rounded-2xl border transition-all duration-200 relative ${
                        isFocused 
                          ? "bg-white border-zinc-900 border-l-4 border-l-zinc-900 shadow-md ring-1 ring-zinc-900/10" 
                          : "bg-zinc-50/50 border-zinc-200/90 hover:bg-white hover:border-zinc-300 shadow-sm"
                      }`}
                    >
                      {/* MS Forms Question Label Header */}
                      <div className="flex items-start gap-2 mb-3">
                        <span className="text-sm font-bold font-mono text-zinc-900">{index + 1}.</span>
                        <label className="text-sm font-bold text-zinc-900 leading-snug">
                          {field.label} {field.required && <span className="text-red-500 font-bold ml-0.5">*</span>}
                        </label>
                      </div>
                      
                      {field.type === "text" || field.type === "email" || field.type === "phone" || field.type === "number" || field.type === "url" || field.type === "date" || field.type === "time" ? (
                        <Input 
                          type={
                            field.type === "email" ? "email" : 
                            field.type === "number" ? "number" : 
                            field.type === "url" ? "url" : 
                            field.type === "date" ? "date" : 
                            field.type === "time" ? "time" : "text"
                          }
                          required={field.required}
                          readOnly={field.readOnly}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          value={(answers[field.id] as string) || ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                          className={`bg-white border-zinc-200 text-zinc-900 h-12 rounded-xl px-4 text-sm transition-all focus:bg-white focus-visible:ring-1 focus-visible:ring-zinc-900 placeholder:text-zinc-400 ${fieldErrors[field.id] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        />
                      ) : field.type === "textarea" ? (
                        <Textarea 
                          required={field.required}
                          readOnly={field.readOnly}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          value={(answers[field.id] as string) || ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                          className={`bg-white border-zinc-200 text-zinc-900 min-h-[90px] rounded-xl p-4 text-sm transition-all focus:bg-white focus-visible:ring-1 focus-visible:ring-zinc-900 placeholder:text-zinc-400 resize-y ${fieldErrors[field.id] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        />
                      ) : field.type === "dropdown" || field.type === "country" || field.type === "state" || field.type === "multiselect" ? (
                        <div className="relative">
                          <select 
                            required={field.required}
                            multiple={field.type === "multiselect"}
                            disabled={field.readOnly}
                            value={field.type === "multiselect" ? (Array.isArray(answers[field.id]) ? answers[field.id] as string[] : []) : (answers[field.id] as string) || ""}
                            onChange={(e) => field.type === "multiselect" ? setAnswers(prev => ({...prev, [field.id]: Array.from(e.target.selectedOptions, option => option.value)})) : handleFieldChange(field.id, e.target.value, field.type)}
                            className={`w-full bg-white border border-zinc-200 text-zinc-900 h-12 rounded-xl px-4 pr-11 text-sm transition-all focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer appearance-none ${fieldErrors[field.id] ? "border-red-500 focus:ring-red-500" : ""}`}
                          >
                            <option value="" disabled className="text-zinc-400">
                              {field.placeholder || `Select ${field.label}...`}
                            </option>
                            {field.options && field.options.length > 0 ? (
                              field.options.map((opt: string, optIdx: number) => (
                                <option key={`${opt}-${optIdx}`} value={opt} className="text-zinc-900">
                                  {opt}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="Option 1" className="text-zinc-900">Option 1</option>
                                <option value="Option 2" className="text-zinc-900">Option 2</option>
                              </>
                            )}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                      ) : field.type === "radio" ? (
                        <div className="space-y-2 pt-1">
                          {(field.options && field.options.length > 0 ? field.options : ["Option 1", "Option 2"]).map((opt: string, optIdx: number) => (
                            <label key={`${opt}-${optIdx}`} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer transition-colors">
                              <input
                                type="radio"
                                name={field.id}
                                value={opt}
                                checked={answers[field.id] === opt}
                                onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                                className="h-4 w-4 text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                              />
                              <span className="text-sm font-medium text-zinc-800">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === "checkbox" ? (
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={!!answers[field.id]}
                            onChange={(e) => handleFieldChange(field.id, e.target.checked ? "true" : "", field.type)}
                            className="h-4 w-4 rounded text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                          />
                          <span className="text-sm font-medium text-zinc-800">{field.placeholder || "I agree / Confirm"}</span>
                        </label>
                      ) : (
                        <Input 
                          type="text"
                          required={field.required}
                          readOnly={field.readOnly}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          value={(answers[field.id] as string) || ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value, field.type)}
                          className={`bg-white border-zinc-200 text-zinc-900 h-12 rounded-xl px-4 text-sm transition-all focus:bg-white focus-visible:ring-1 focus-visible:ring-zinc-900 placeholder:text-zinc-400 ${fieldErrors[field.id] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        />
                      )}
                      
                      {!!fieldErrors[field.id] && (
                        <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-red-500" /> {fieldErrors[field.id] as string}
                        </p>
                      )}
                      {!!field.description && !fieldErrors[field.id] && <p className="text-xs text-zinc-500 mt-2">{field.description}</p>}
                    </motion.div>
                  );
                })}
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-4 border-t border-zinc-100"
              >
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-base font-bold h-14 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-md group" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Complete Registration
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>
          </div>
        </motion.div>
        
        <div className="mt-8 text-center text-xs font-medium text-zinc-400 pb-8 flex justify-center items-center gap-1">
          Powered by <span className="text-zinc-700 font-bold">PAHCHAAN</span>
        </div>
      </div>
    </div>
  );
}
