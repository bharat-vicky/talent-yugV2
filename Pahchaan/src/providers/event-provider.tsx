"use client";

import { createContext, useContext, ReactNode } from "react";
import { 
  Event, 
  EventSettings, 
  BrandingSettings, 
  RegistrationSettings, 
  ScannerSettings,
  QRConfiguration,
  GuestConfiguration,
  Role,
  NotificationSettings
} from "@/domain/types";

export interface EventContextState {
  event: Event;
  settings: EventSettings;
  branding: BrandingSettings;
  registration: RegistrationSettings;
  scanner: ScannerSettings;
  qr: QRConfiguration;
  guest: GuestConfiguration;
  notification: NotificationSettings;
  role: Role;
}

const EventContext = createContext<EventContextState | undefined>(undefined);

export function EventProvider({ children, value }: { children: ReactNode, value: EventContextState }) {
  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
}
