import { Html5Qrcode } from "html5-qrcode";
import { ScannerAdapter, ScannerConfig } from "./ScannerAdapter";

export class Html5QrScannerAdapter implements ScannerAdapter {
  private scanner: Html5Qrcode | null = null;
  private config: ScannerConfig;
  private elementId: string = "";
  private isScanning: boolean = false;
  private currentCameraId: string | null = null;
  private supportsTorch: boolean = false;

  private onSuccessCb?: (decodedText: string) => void;
  private onErrorCb?: (error: unknown) => void;

  constructor(config: ScannerConfig) {
    this.config = config;
  }

  async init(
    elementId: string, 
    onSuccess: (decodedText: string) => void, 
    onError?: (error: unknown) => void
  ): Promise<void> {
    this.elementId = elementId;
    this.onSuccessCb = onSuccess;
    this.onErrorCb = onError;
    this.scanner = new Html5Qrcode(elementId);
    
    try {
      await Html5Qrcode.getCameras();
    } catch (err) {
      console.warn("Camera permissions not granted yet", err);
    }
  }

  async start(cameraId?: string): Promise<void> {
    if (!this.scanner) throw new Error("Scanner not initialized");
    if (this.isScanning) await this.stop();

    const targetCamera = cameraId || { facingMode: "environment" };
    
    const tryStart = async (cameraConfig: unknown) => {
      await this.scanner!.start(
        cameraConfig as string | MediaTrackConstraints,
        this.config,
        (decodedText) => {
          if (this.onSuccessCb) this.onSuccessCb(decodedText);
        },
        (errorMessage) => {
          if (this.onErrorCb) this.onErrorCb(errorMessage);
        }
      );
    };

    try {
      await tryStart(targetCamera);
    } catch (err: unknown) {
      // If the environment camera is requested but not available (like on a Macbook), it throws OverconstrainedError
      if (!cameraId && (err as Error)?.name === "OverconstrainedError" || String(err).includes("OverconstrainedError")) {
        try {
          await tryStart({ facingMode: "user" });
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      } else {
        throw err;
      }
    }

    try {
      this.isScanning = true;
      this.currentCameraId = typeof targetCamera === "string" ? targetCamera : null;

      const track = (this.scanner as unknown as Record<string, () => MediaStreamTrack>).getRunningTrack ? (this.scanner as unknown as Record<string, () => MediaStreamTrack>).getRunningTrack() : null;
      if (track) {
        const capabilities = track.getCapabilities() as Record<string, unknown>;
        this.supportsTorch = !!capabilities?.torch;
      }
    } catch (err) {
      console.warn("Failed to get track capabilities", err);
    }
  }

  async stop(): Promise<void> {
    if (this.scanner && this.isScanning) {
      try {
        await this.scanner.stop();
        this.scanner.clear();
      } catch (err) {
        // Ignore DOM removal errors if React already unmounted the container
        console.warn("Scanner stopped with DOM exception:", err);
      } finally {
        this.isScanning = false;
        this.currentCameraId = null;
      }
    }
  }

  pause(): void {
    if (this.scanner && this.isScanning) {
      this.scanner.pause();
    }
  }

  resume(): void {
    if (this.scanner && this.isScanning) {
      this.scanner.resume();
    }
  }

  async getCameras(): Promise<{ id: string; label: string }[]> {
    try {
      const devices = await Html5Qrcode.getCameras();
      return devices.map(d => ({ id: d.id, label: d.label }));
    } catch (_err) {
      return [];
    }
  }

  async setTorch(enabled: boolean): Promise<void> {
    if (!this.scanner || !this.isScanning || !this.supportsTorch) return;
    
    try {
      await this.scanner.applyVideoConstraints({
        advanced: [{ torch: enabled }] as unknown as MediaTrackConstraintSet[]
      });
    } catch (err) {
      console.error("Failed to set torch", err);
    }
  }

  hasTorch(): boolean {
    return this.supportsTorch;
  }
}
