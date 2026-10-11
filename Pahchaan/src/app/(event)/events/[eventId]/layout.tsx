import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { membershipRepository } from "@/infrastructure/repositories/MembershipRepository";
import { workspaceRepository } from "@/infrastructure/repositories/WorkspaceRepository";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { 
  eventSettingsRepository,
  brandingSettingsRepository,
  registrationSettingsRepository,
  scannerSettingsRepository,
  qrConfigurationRepository,
  guestConfigurationRepository,
  notificationSettingsRepository
} from "@/infrastructure/repositories/SettingsRepositories";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EventProvider, EventContextState } from "@/providers/event-provider";
import { 
  LayoutDashboard, 
  Settings, 
  QrCode, 
  Users, 
  ScanLine, 
  BarChart,
  ClipboardList,
  Bell
} from "lucide-react";

export default async function EventLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { eventId } = await params;

  // 1. Parallel Step: Load Event and User Memberships simultaneously
  const [event, memberships] = await Promise.all([
    eventRepository.findById(eventId),
    membershipRepository.findByUserId(session.user.id)
  ]);

  if (!event) redirect("/events");

  const membership = memberships.find(m => m.workspaceId === event.workspaceId);
  if (!membership) redirect("/events");

  // 2. Parallel Step: Load Workspace and all 7 Settings collections simultaneously
  const [
    workspace,
    [settings],
    [branding],
    [registration],
    [scanner],
    [qr],
    [guest],
    [notification]
  ] = await Promise.all([
    workspaceRepository.findById(event.workspaceId),
    eventSettingsRepository.findMany({ eventId }),
    brandingSettingsRepository.findMany({ eventId }),
    registrationSettingsRepository.findMany({ eventId }),
    scannerSettingsRepository.findMany({ eventId }),
    qrConfigurationRepository.findMany({ eventId }),
    guestConfigurationRepository.findMany({ eventId }),
    notificationSettingsRepository.findMany({ eventId })
  ]);

  if (!workspace) redirect("/events");

  // Resilient fallbacks to guarantee no blank-screen crashes
  const effectiveSettings = settings || {
    workspaceId: event.workspaceId,
    eventId,
    timezone: "UTC",
    maxCapacity: 500,
    allowWaitlist: false,
    updatedAt: new Date()
  };

  const effectiveBranding = branding || {
    workspaceId: event.workspaceId,
    eventId,
    primaryColor: "#18181b",
    secondaryColor: "#71717a",
    updatedAt: new Date()
  };

  const effectiveRegistration = registration || {
    workspaceId: event.workspaceId,
    eventId,
    requireApproval: false,
    allowWaitlist: false,
    updatedAt: new Date()
  };

  const effectiveScanner = scanner || {
    workspaceId: event.workspaceId,
    eventId,
    offlineMode: true,
    soundFeedback: true,
    hapticFeedback: true,
    cameraFacing: "environment" as const,
    autoSync: true,
    updatedAt: new Date()
  };

  const effectiveQr = qr || {
    workspaceId: event.workspaceId,
    eventId,
    style: "rounded",
    fgColor: "#000000",
    bgColor: "#ffffff",
    updatedAt: new Date()
  };

  const effectiveGuest = guest || {
    workspaceId: event.workspaceId,
    eventId,
    collectPhone: false,
    collectOrganization: true,
    customFields: [],
    updatedAt: new Date()
  };

  const effectiveNotification = notification || {
    workspaceId: event.workspaceId,
    eventId,
    emailAlerts: true,
    dailyDigest: false,
    showDashboardBadge: true,
    notifyOnRegistration: true,
    notifyOnScan: true,
    notifyOnExport: true,
    notifyOnImport: true,
    notifyOnQRGen: true,
    updatedAt: new Date()
  };

  // Proactively initialize any missing settings in database in the background
  try {
    if (!settings) eventSettingsRepository.create(effectiveSettings).catch(() => {});
    if (!branding) brandingSettingsRepository.create(effectiveBranding).catch(() => {});
    if (!registration) registrationSettingsRepository.create(effectiveRegistration).catch(() => {});
    if (!scanner) scannerSettingsRepository.create(effectiveScanner).catch(() => {});
    if (!qr) qrConfigurationRepository.create(effectiveQr).catch(() => {});
    if (!guest) guestConfigurationRepository.create(effectiveGuest).catch(() => {});
    if (!notification) notificationSettingsRepository.create(effectiveNotification).catch(() => {});
  } catch {}

  const contextValue: EventContextState = {
    event,
    settings: effectiveSettings,
    branding: effectiveBranding,
    registration: effectiveRegistration,
    scanner: effectiveScanner,
    qr: effectiveQr,
    guest: effectiveGuest,
    notification: effectiveNotification,
    role: membership.role
  };

  const eventNavigation = [
    { name: "← Back to Events", href: "/events", icon: <LayoutDashboard /> },
    { name: "Dashboard", href: `/events/${eventId}`, icon: <LayoutDashboard /> },
    { name: "Registration", href: `/events/${eventId}/registration`, icon: <ClipboardList /> },
    { name: "QR Studio", href: `/events/${eventId}/qr`, icon: <QrCode /> },
    { name: "Guests", href: `/events/${eventId}/guests`, icon: <Users /> },
    { name: "Scanner", href: `/events/${eventId}/scanner`, icon: <ScanLine /> },
    { name: "Notifications", href: `/events/${eventId}/notifications`, icon: <Bell /> },
    { name: "Analytics", href: `/events/${eventId}/analytics`, icon: <BarChart /> },
    { name: "Settings", href: `/events/${eventId}/settings`, icon: <Settings /> },
  ];

  return (
    <EventProvider value={contextValue}>
      <DashboardShell 
        user={session.user} 
        workspace={workspace}
        memberships={memberships}
        navigation={eventNavigation}
      >
        {children}
      </DashboardShell>
    </EventProvider>
  );
}
