"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Printer, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { badgePdf } from "@/lib/badge-pdf";
import { toast } from "sonner";

export default function BadgeStudioPage({ params }: { params: Promise<{ eventId: string; guestId: string }> }) {
  const { eventId, guestId } = use(params);
  const [badgeTemplate, setBadgeTemplate] = useState("Standard Attendee");
  const [isSending, setIsSending] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  const { data: guest, isLoading, error } = useQuery({
    queryKey: ["guest", eventId, guestId],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/${guestId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Could not load this badge.");
      return json.data;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const badgeElement = document.getElementById("badge-preview-element");
    if (!badgeElement) return;

    try {
      toast.loading("Generating PDF...", { id: "pdf-toast" });

      const pdf = await badgePdf(badgeElement);
      pdf.save(`Badge_${guest?.firstName}_${guest?.lastName}.pdf`);

      toast.success("PDF Downloaded", { id: "pdf-toast" });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF", { id: "pdf-toast" });
    }
  };

  const handleSendInvitation = async () => {
    const badgeElement = document.getElementById("badge-preview-element");
    if (!badgeElement || isSending) return;
    if (!guest?.email) { toast.error("Add an email address to this guest before sending an invitation."); return; }

    try {
      setIsSending(true);
      toast.loading("Generating PDF & sending invitation...", { id: "send-toast" });

      const pdf = await badgePdf(badgeElement);
      const pdfDataUri = pdf.output("datauristring");

      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestIds: [guestId],
          attachment: pdfDataUri,
          customMessage: customMessage
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success || result.count !== 1) throw new Error(result.error || "Could not queue the invitation. Please try again.");

      toast.success("Invitation queued with badge attached. Delivery will follow shortly.", { id: "send-toast" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invitation", { id: "send-toast" });
    } finally {
      setIsSending(false);
    }
  };

  if (error) return <div role="alert" className="p-8">{error.message}</div>;
  if (isLoading || !guest) return <div className="p-8">Loading badge...</div>;

  // The QR payload (can be URL or JSON)
  const qrData = JSON.stringify({ guestId });

  // Real-Life Conference & Event Inspired Badge Color Themes
  const getThemeStyles = () => {
    switch (badgeTemplate) {
      case "VIP Access":
        return {
          top: "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-zinc-950 shadow-md",
          topTag: "text-zinc-950/80 font-black",
          bottom: "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-zinc-950 font-black tracking-[0.2em] shadow-inner",
          bg: "bg-amber-50/40",
          text: "text-zinc-950",
          qrBorder: "border-amber-300/80 bg-white shadow-md ring-2 ring-amber-400/40",
          accent: "text-amber-900 font-bold tracking-tight",
          pattern: "bg-amber-50/30"
        };
      case "Speaker":
        return {
          top: "bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-800 text-white shadow-md",
          topTag: "text-violet-200/90 font-black",
          bottom: "bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-800 text-white font-black tracking-[0.2em] shadow-inner",
          bg: "bg-violet-50/40",
          text: "text-zinc-950",
          qrBorder: "border-violet-200 bg-white shadow-md ring-2 ring-violet-500/30",
          accent: "text-violet-900 font-bold tracking-tight",
          pattern: "bg-violet-50/30"
        };
      case "Staff / Volunteer":
        return {
          top: "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 text-white shadow-md",
          topTag: "text-emerald-100/90 font-black",
          bottom: "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 text-white font-black tracking-[0.2em] shadow-inner",
          bg: "bg-emerald-50/40",
          text: "text-zinc-950",
          qrBorder: "border-emerald-200 bg-white shadow-md ring-2 ring-emerald-500/30",
          accent: "text-emerald-900 font-bold tracking-tight",
          pattern: "bg-emerald-50/30"
        };
      case "Press / Media":
        return {
          top: "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md",
          topTag: "text-red-100/90 font-black",
          bottom: "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black tracking-[0.2em] shadow-inner",
          bg: "bg-rose-50/40",
          text: "text-zinc-950",
          qrBorder: "border-red-200 bg-white shadow-md ring-2 ring-red-500/30",
          accent: "text-red-900 font-bold tracking-tight",
          pattern: "bg-rose-50/30"
        };
      case "Exhibitor":
        return {
          top: "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md",
          topTag: "text-blue-100/90 font-black",
          bottom: "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black tracking-[0.2em] shadow-inner",
          bg: "bg-blue-50/40",
          text: "text-zinc-950",
          qrBorder: "border-blue-200 bg-white shadow-md ring-2 ring-blue-500/30",
          accent: "text-blue-900 font-bold tracking-tight",
          pattern: "bg-blue-50/30"
        };
      case "Sponsor":
        return {
          top: "bg-gradient-to-r from-orange-600 via-amber-500 to-orange-700 text-white shadow-md",
          topTag: "text-orange-100/90 font-black",
          bottom: "bg-gradient-to-r from-orange-600 via-amber-500 to-orange-700 text-white font-black tracking-[0.2em] shadow-inner",
          bg: "bg-orange-50/40",
          text: "text-zinc-950",
          qrBorder: "border-orange-200 bg-white shadow-md ring-2 ring-orange-500/30",
          accent: "text-orange-900 font-bold tracking-tight",
          pattern: "bg-orange-50/30"
        };
      default: // Standard Attendee (Sleek Corporate Obsidian)
        return {
          top: "bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-950 text-white shadow-md",
          topTag: "text-zinc-400 font-black",
          bottom: "bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-950 text-white font-black tracking-[0.2em] shadow-inner",
          bg: "bg-white",
          text: "text-zinc-950",
          qrBorder: "border-zinc-200 bg-white shadow-md ring-1 ring-zinc-900/10",
          accent: "text-zinc-900 font-bold tracking-tight",
          pattern: "bg-white"
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div className="h-full flex">
      {/* Sidebar Controls (Hidden when printing) */}
      <div className="w-80 border-r border-border bg-card p-6 flex flex-col print:hidden">
        <div>
          <h2 className="text-lg font-semibold">Badge Studio</h2>
          <p className="text-sm text-muted-foreground mt-1">Design and print attendee badges directly from your browser.</p>
        </div>

        <div className="mt-8 space-y-6 flex-1">
          <div className="space-y-3">
            <label className="text-sm font-medium">Template</label>
            <select
              value={badgeTemplate}
              onChange={(e) => setBadgeTemplate(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm cursor-pointer"
            >
              <option>Standard Attendee</option>
              <option>VIP Access</option>
              <option>Speaker</option>
              <option>Staff / Volunteer</option>
              <option>Press / Media</option>
              <option>Exhibitor</option>
              <option>Sponsor</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Print Format</label>
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm cursor-pointer">
              <option>Single Badge (Thermal 4x3&quot;)</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Email Message</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Optional custom message..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm min-h-[80px]"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-border space-y-3">
          <Button variant="outline" className="w-full cursor-pointer" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
          <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer" onClick={handleSendInvitation} disabled={isSending}>
            <Send className="w-4 h-4 mr-2" /> {isSending ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </div>

      {/* Live Preview Area */}
      <div className="flex-1 bg-muted/20 p-12 overflow-auto flex items-center justify-center print:p-0 print:bg-white">
        {/* Actual Printable Badge Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div
            id="badge-preview-element"
            className="bg-white shadow-xl rounded-3xl overflow-hidden flex flex-col relative print:shadow-none print:rounded-none ring-1 ring-black/5"
            style={{ width: '400px', height: '600px' }}
          >
            {/* Top Branding Banner */}
            <div className={`h-28 flex items-center justify-center p-6 relative overflow-hidden ${theme.top}`}>
              {/* Ambient light glow inside banner */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[40px] rounded-full pointer-events-none" />
              <div className="text-3xl font-black tracking-tighter uppercase flex flex-col items-center relative z-10">
                <span className="drop-shadow-md">PAHCHAAN</span>
                <span className={`text-[10px] font-bold tracking-[0.4em] opacity-90 mt-1 ${theme.topTag}`}>2026</span>
              </div>
            </div>

            {/* Attendee Details */}
            <div className={`flex-1 flex flex-col items-center pt-8 px-6 text-center relative overflow-hidden ${theme.bg} ${theme.pattern}`}>
              <h1 className={`text-4xl font-black tracking-tight leading-[1.1] relative z-10 ${theme.text}`}>
                {guest.firstName}
                <br />
                {guest.lastName}
              </h1>

              {guest.organization && (
                <p className={`text-lg mt-4 relative z-10 ${theme.accent}`}>
                  {guest.organization}
                </p>
              )}

              {guest.title && (
                <p className="text-zinc-500 mt-1 font-medium relative z-10">
                  {guest.title}
                </p>
              )}

              {/* Dynamic QR Code */}
              <div className={`mt-auto mb-6 p-4 rounded-3xl border relative z-10 flex flex-col items-center justify-center ${theme.qrBorder}`}>
                <QRCodeSVG
                  value={qrData}
                  size={140}
                  level="H"
                  includeMargin={false}
                />
                <div className="mt-3 text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                  ID: {guestId.substring(0, 8)}
                </div>
              </div>
            </div>

            {/* Bottom Sleek Footer */}
            <div data-testid="badge-role-footer"
            style={{ flex: "0 0 48px" }}
            className={`h-12 w-full flex items-center justify-center px-8 text-[10px] font-black tracking-widest uppercase relative overflow-hidden ${theme.bottom}`}>
              <span className="block w-full text-center whitespace-nowrap leading-none opacity-90" style={{ flexShrink: 0 }}>{badgeTemplate}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Global CSS overrides for printing only this specific component */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .flex-1 > div {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 4in !important;
            height: 6in !important;
            border: 1px solid #000;
          }
          .flex-1 > div * {
            visibility: visible;
          }
          @page {
            size: 4in 6in;
            margin: 0;
          }
        }
      `}} />
    </div>
  );
}
