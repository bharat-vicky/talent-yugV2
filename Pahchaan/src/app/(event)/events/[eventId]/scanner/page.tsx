/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useEffect, useState, useEffectEvent } from "react";
import { CameraService } from "@/application/services/CameraService";
import { useSession } from "next-auth/react";
import { ScanResult } from "@/application/services/ScannerService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  SwitchCamera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  User as UserIcon, 
  WifiOff, 
  Lightbulb, 
  LightbulbOff, 
  Camera,
  Phone,
  Briefcase,
  Building2,
  Mail,
  CheckSquare,
  ExternalLink,
  QrCode,
  Sparkles,
  X,
  History,
  UserCheck
} from "lucide-react";
import { OfflineQueueService } from "@/application/services/OfflineQueueService";
import { toast } from "sonner";
import Link from "next/link";

const ResultIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "success": return <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-3 mx-auto" />;
    case "duplicate": return <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-3 mx-auto" />;
    case "warning": return <AlertTriangle className="w-16 h-16 text-orange-500 mb-3 mx-auto" />;
    case "offline_queued": return <WifiOff className="w-16 h-16 text-blue-500 mb-3 mx-auto" />;
    default: return <XCircle className="w-16 h-16 text-rose-500 mb-3 mx-auto" />;
  }
};

export default function ScannerTerminalPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { data: session } = useSession();
  
  const [cameraService, setCameraService] = useState<CameraService | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{id: string, label: string}[]>([]);
  const [torchOn, setTorchOn] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [overlay, setOverlay] = useState<ScanResult | null>(null);
  const [activeGuest, setActiveGuest] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [isApproving, setIsApproving] = useState(false);

  const handleApproveAndCheckIn = async (guestId: string) => {
    if (!guestId) return;
    setIsApproving(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/${guestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" })
      });
      if (!res.ok) throw new Error("Failed to approve guest");

      const scanRes = await fetch(`/pahchaan/api/events/${eventId}/scanner/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, direction: "in" })
      });
      const scanData = await scanRes.json();
      
      toast.success("Guest approved and checked in successfully!");
      setOverlay(scanData);
      if (scanData.guest) {
        setActiveGuest(scanData.guest);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to approve guest");
    } finally {
      setIsApproving(false);
    }
  };

  async function handleScan(qrData: string, activeService?: CameraService) {
    // Pause immediately to prevent multiple scans of the same QR
    (activeService || cameraService)?.pause();

    const isOnline = navigator.onLine;
    let result: ScanResult;

    if (isOnline) {
      try {
        const res = await fetch(`/pahchaan/api/events/${eventId}/scanner/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrData, direction: "in" })
        });
        const data = await res.json();
        
        if (!res.ok) {
          result = { success: false, status: "invalid", reason: data.error || "Unknown error" };
        } else {
          result = data as ScanResult;
        }
      } catch (e: unknown) {
        // Fallback to offline queue if fetch fails
        result = await enqueueOfflineScan(qrData);
      }
    } else {
      result = await enqueueOfflineScan(qrData);
    }

    // Play Sound Feedback
    playAudioFeedback(result.status);
    
    // Update active guest state
    if (result.guest) {
      setActiveGuest(result.guest);
      setActiveTab("details");
    }

    // Show Overlay
    setOverlay(result);
    setRecentScans(prev => [result, ...prev].slice(0, 50)); // Keep last 50

    // Auto resume after delay
    const delay = cameraService?.getSettings().autoResumeDelay || 3000;
    setTimeout(() => {
      setOverlay(null);
      cameraService?.resume();
    }, delay);
  };

  const dismissOverlay = () => {
    setOverlay(null);
    cameraService?.resume();
  };

  const enqueueOfflineScan = async (qrData: string): Promise<ScanResult> => {
    const scanId = crypto.randomUUID();
    await OfflineQueueService.enqueueScan({
      id: scanId,
      eventId,
      qrPayload: qrData,
      timestamp: new Date(),
      scannerId: "browser-session",
      operatorId: session?.user?.id || "",
      method: "qr_scan",
      direction: "in",
      retryCount: 0,
      syncStatus: "pending"
    });
    
    return {
      success: false,
      status: "offline_queued",
      reason: "Queued offline. Admission has not been verified.",
      guest: { firstName: "Attendee", lastName: "(Offline Queue)" }
    };
  };

  const playAudioFeedback = (status: string) => {
    if (!cameraService?.getSettings().beep) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (status === "success" || status === "offline_queued") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
      } else {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio fallback
    }
  };

  const toggleScanner = async () => {
    if (!cameraService) return;
    
    if (isScanning) {
      await cameraService.stop();
      setIsScanning(false);
    } else {
      try {
        await cameraService.start();
        setIsScanning(true);
      } catch (e: unknown) {
        toast.error("Failed to start camera: " + ((e as Error)?.message || String(e)));
      }
    }
  };

  const toggleTorch = async () => {
    if (!cameraService) return;
    await cameraService.getAdapter().setTorch(!torchOn);
    setTorchOn(!torchOn);
  };

  const switchCamera = async () => {
    if (!cameraService || cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === cameraService.getSettings().defaultCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    await cameraService.switchCamera(cameras[nextIndex].id);
  };

  const onCameraScan=useEffectEvent((data:string,service:CameraService)=>handleScan(data,service));
  useEffect(() => {
    const sync = () => { if (navigator.onLine && session?.user?.id) void OfflineQueueService.sync(eventId, session.user.id).catch(() => {}); };
    window.addEventListener("online", sync);
    const syncInterval = setInterval(sync, 10000);
    sync();
    const service = new CameraService({fps:10,qrbox:260,aspectRatio:1,disableFlip:false});
    let disposed=false;
    service.init("reader",decodedText=>{void onCameraScan(decodedText, service);},()=>{}).then(async()=>{
      if(disposed)return;
      setCameraService(service);
      const available=await service.getAdapter().getCameras();if(!disposed)setCameras(available);
    }).catch(()=>toast.error("Camera is unavailable. Check permissions or use another device."));
    return ()=>{window.removeEventListener("online",sync);clearInterval(syncInterval);disposed=true;void service.stop().catch(()=>{});};
  }, [eventId, session?.user?.id]);

  return (
    <div className="flex flex-col lg:flex-row flex-1 w-full h-full overflow-hidden bg-background">
      
      {/* Viewfinder Area (Camera & Live HUD) */}
      <div className="flex-1 bg-black relative flex flex-col items-center justify-center min-h-[360px] lg:min-h-0">
        
        {/* Camera Container Wrapper */}
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          {/* Target must remain empty of React children */}
          <div id="reader" className="w-full h-full object-cover"></div>
          
          {!isScanning && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center">
              <div className="w-20 h-20 rounded-3xl bg-muted/20 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                <Camera className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">QR Badge Scanner</h2>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                Position attendee QR code in the camera frame to verify their guest pass and record check-in.
              </p>
              <Button size="lg" className="rounded-xl px-8 font-semibold shadow-lg hover:scale-105 transition-transform" onClick={toggleScanner}>
                <Play className="w-4 h-4 mr-2" /> Start Scanning
              </Button>
            </div>
          )}

          {/* Real-Time Scan Result Overlay Card */}
          {overlay && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in-95 p-6 text-center">
              <button 
                onClick={dismissOverlay} 
                className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                title="Dismiss & Next Scan"
              >
                <X className="w-5 h-5" />
              </button>

              <ResultIcon status={overlay.status} />

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 tracking-tight">
                {overlay.status === "success" && "Successfully Scanned"}
                {overlay.status === "duplicate" && "Successfully Scanned (Verified)"}
                {overlay.status === "invalid" && "Access Denied"}
                {overlay.status === "offline_queued" && "Queued Offline"}
              </h2>

              <p className="text-xs sm:text-sm text-emerald-400/90 mb-4 max-w-md font-medium">
                {overlay.status === "success" && "Attendee verified and check-in recorded."}
                {overlay.status === "duplicate" && "Attendee is valid and checked in."}
                {overlay.status === "invalid" && (overlay.reason || "Invalid or cancelled ticket.")}
                {overlay.status === "offline_queued" && "Scan queued locally and will sync once reconnected."}
              </p>

              {/* Scanned Guest Card inside Overlay */}
              {Boolean(overlay.guest) && (
                <div className="w-full max-w-md bg-white/10 border border-white/15 rounded-2xl p-5 text-left text-white shadow-2xl backdrop-blur-md mt-2 space-y-3">
                  <div className="flex items-center gap-3.5 border-b border-white/10 pb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
                      {((overlay.guest as any).firstName || "G").charAt(0)}
                      {((overlay.guest as any).lastName || "").charAt(0)}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="text-lg font-bold truncate">
                        {(overlay.guest as any).firstName} {(overlay.guest as any).lastName}
                      </div>
                      <div className="text-xs text-white/70 truncate flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        {(overlay.guest as any).email || "No email"}
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize shrink-0 bg-white/20 text-white font-medium border-0 text-xs">
                      {(overlay.guest as any).status || "Attendee"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    {/* Role/Title */}
                    <div className="bg-black/30 rounded-xl p-2.5 flex items-start gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-white/60 shrink-0 mt-0.5" />
                      <div className="overflow-hidden">
                        <div className="text-[10px] text-white/50 uppercase font-semibold">Role / Title</div>
                        <div className="font-semibold text-white/90 truncate">{(overlay.guest as any).title || "—"}</div>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="bg-black/30 rounded-xl p-2.5 flex items-start gap-2">
                      <Building2 className="w-3.5 h-3.5 text-white/60 shrink-0 mt-0.5" />
                      <div className="overflow-hidden">
                        <div className="text-[10px] text-white/50 uppercase font-semibold">Company</div>
                        <div className="font-semibold text-white/90 truncate">{(overlay.guest as any).organization || "—"}</div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="bg-black/30 rounded-xl p-2.5 flex items-start gap-2 col-span-2">
                      <Phone className="w-3.5 h-3.5 text-white/60 shrink-0 mt-0.5" />
                      <div className="overflow-hidden">
                        <div className="text-[10px] text-white/50 uppercase font-semibold">Phone</div>
                        <div className="font-semibold text-white/90 truncate">{(overlay.guest as any).phone || "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                {overlay.status === "invalid" && overlay.guest && (overlay.guest as any)._id && (
                  <Button 
                    size="sm" 
                    onClick={() => handleApproveAndCheckIn((overlay.guest as any)._id)} 
                    disabled={isApproving}
                    className="rounded-xl text-xs px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg"
                  >
                    {isApproving ? "Approving..." : "Approve & Check In"}
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={dismissOverlay}
                  className="rounded-xl text-xs px-6 font-semibold bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  Scan Next Attendee
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Camera Controls Toolbar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl z-20">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl w-10 h-10 text-white hover:bg-white/20" 
            onClick={toggleScanner}
            title={isScanning ? "Pause Scanner" : "Start Scanner"}
          >
            {isScanning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          {cameras.length > 1 && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl w-10 h-10 text-white hover:bg-white/20" 
              onClick={switchCamera}
              title="Switch Camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </Button>
          )}

          {cameraService?.getAdapter().hasTorch() && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl w-10 h-10 text-white hover:bg-white/20" 
              onClick={toggleTorch}
              title="Toggle Flashlight"
            >
              {torchOn ? <Lightbulb className="w-5 h-5 text-yellow-400" /> : <LightbulbOff className="w-5 h-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Right Section: Detailed Scanned Guest Profile & Live Activity Panel */}
      <div className="w-full lg:w-96 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col shrink-0 overflow-hidden shadow-sm">
        
        {/* Panel Header with Navigation Tabs */}
        <div className="p-3 bg-muted/30 border-b border-border flex items-center gap-2">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "details"
                ? "bg-background text-foreground shadow-sm border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Guest Details
            {activeGuest && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "history"
                ? "bg-background text-foreground shadow-sm border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Live Scans ({recentScans.length})
          </button>
        </div>

        {/* TAB 1: GUEST DETAILS INSPECTOR */}
        {activeTab === "details" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeGuest ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Profile Banner */}
                <div className="bg-muted/30 border border-border/70 rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center mb-3 shadow-md">
                    {(activeGuest.firstName || "G").charAt(0)}
                    {(activeGuest.lastName || "").charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {activeGuest.firstName} {activeGuest.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeGuest.email || "No email specified"}</p>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold">
                      {activeGuest.status === "approved" ? "Verified Attendee" : activeGuest.status || "Approved"}
                    </Badge>
                    {activeGuest.qrCodeId && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs flex items-center gap-1">
                        <QrCode className="w-3 h-3" /> Badge Active
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Attribute Cards Grid */}
                <div className="space-y-3 text-sm">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                    Scanned Guest Information
                  </div>

                  {/* Phone */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-background border border-border/60 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-xs">Phone</span>
                    </div>
                    <span className="font-semibold text-foreground text-sm">
                      {activeGuest.phone || "—"}
                    </span>
                  </div>

                  {/* Role / Title */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-background border border-border/60 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-xs">Role / Title</span>
                    </div>
                    <span className="font-semibold text-foreground text-sm text-right max-w-[180px] truncate">
                      {activeGuest.title || "—"}
                    </span>
                  </div>

                  {/* Company / Organization */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-background border border-border/60 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-xs">Company</span>
                    </div>
                    <span className="font-semibold text-foreground text-sm text-right max-w-[180px] truncate">
                      {activeGuest.organization || "—"}
                    </span>
                  </div>

                  {/* Total Check-Ins */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckSquare className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-xs text-foreground">Total Check-ins</span>
                    </div>
                    <span className="text-base font-black text-primary">
                      {activeGuest.checkIns?.length || 1}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 space-y-2.5">
                  {activeGuest.status === "pending" && activeGuest._id && (
                    <Button 
                      onClick={() => handleApproveAndCheckIn(activeGuest._id)} 
                      disabled={isApproving}
                      className="w-full rounded-xl text-xs font-bold h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      {isApproving ? "Approving & Checking In..." : "Approve & Check In Attendee"}
                    </Button>
                  )}

                  {activeGuest._id && (
                    <Link href={`/events/${eventId}/guests/${activeGuest._id}`} target="_blank">
                      <Button variant="outline" className="w-full rounded-xl text-xs font-semibold h-11 border-border/80 hover:bg-muted">
                        <ExternalLink className="w-3.5 h-3.5 mr-2" />
                        Open Complete Attendee Profile
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center mb-4 text-muted-foreground">
                  <QrCode className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-sm text-foreground">No Guest Scanned Yet</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Scan any attendee&apos;s ticket or QR badge to see their real-time details (Phone, Job Title, Company, Check-in count) right here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE SCANS HISTORY */}
        {activeTab === "history" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {recentScans.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-16">
                No scans recorded in this terminal session.
              </div>
            ) : (
              recentScans.map((scan, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (scan.guest) {
                      setActiveGuest(scan.guest);
                      setActiveTab("details");
                    }
                  }}
                  className="bg-muted/20 hover:bg-muted/40 border border-border/60 rounded-xl p-3 text-xs flex gap-3 items-start cursor-pointer transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {scan.status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {scan.status === "duplicate" && <Clock className="w-4 h-4 text-amber-500" />}
                    {scan.status === "invalid" && <XCircle className="w-4 h-4 text-rose-500" />}
                    {scan.status === "offline_queued" && <WifiOff className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate text-foreground">
                      {scan.guest ? `${(scan.guest as any).firstName} ${(scan.guest as any).lastName}` : "Unknown Guest"}
                    </p>
                    {((scan.guest as any)?.title || (scan.guest as any)?.organization) && (
                      <p className="text-muted-foreground truncate mt-0.5">
                        {[((scan.guest as any).title), ((scan.guest as any).organization)].filter(Boolean).join(" @ ")}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/80 mt-1">
                      {scan.reason || "Checked In Successfully"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

    </div>
  );
}
