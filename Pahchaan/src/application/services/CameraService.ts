import { ScannerAdapter, ScannerConfig } from "./ScannerAdapter";
import { Html5QrScannerAdapter } from "./Html5QrScannerAdapter";

export interface CameraSettings {
  defaultCameraId: string | null;
  continuousScan: boolean;
  autoResumeDelay: number;
  beep: boolean;
  vibrate: boolean;
  torchDefault: boolean;
  mirrorCamera: boolean;
}

const DEFAULT_SETTINGS: CameraSettings = {
  defaultCameraId: null,
  continuousScan: true,
  autoResumeDelay: 2000,
  beep: true,
  vibrate: true,
  torchDefault: false,
  mirrorCamera: false,
};

export class CameraService {
  private adapter: ScannerAdapter;
  private settings: CameraSettings;

  constructor(config: ScannerConfig) {
    this.adapter = new Html5QrScannerAdapter(config);
    this.settings = this.loadSettings();
  }

  getAdapter(): ScannerAdapter {
    return this.adapter;
  }

  private loadSettings(): CameraSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem("IdentityScannerSettings");
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      // Ignore
    }
    return DEFAULT_SETTINGS;
  }

  saveSettings(settings: Partial<CameraSettings>) {
    this.settings = { ...this.settings, ...settings };
    if (typeof window !== "undefined") {
      localStorage.setItem("IdentityScannerSettings", JSON.stringify(this.settings));
    }
  }

  getSettings(): CameraSettings {
    return this.settings;
  }

  async init(elementId: string, onSuccess: (text: string) => void, onError?: (error: unknown) => void) {
    await this.adapter.init(elementId, onSuccess, onError);
  }

  async start() {
    await this.adapter.start(this.settings.defaultCameraId || undefined);
    if (this.settings.torchDefault && this.adapter.hasTorch()) {
      await this.adapter.setTorch(true);
    }
  }

  async stop() {
    await this.adapter.stop();
  }

  async switchCamera(cameraId: string) {
    await this.adapter.stop();
    this.saveSettings({ defaultCameraId: cameraId });
    await this.start();
  }

  pause() {
    this.adapter.pause();
  }

  resume() {
    this.adapter.resume();
  }
}
