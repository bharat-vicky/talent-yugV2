export interface ScannerConfig {
  fps: number;
  qrbox: number | { width: number; height: number };
  aspectRatio?: number;
  disableFlip?: boolean;
}

export interface ScannerAdapter {
  init(
    elementId: string, 
    onSuccess: (decodedText: string) => void, 
    onError?: (error: unknown) => void
  ): Promise<void>;
  start(cameraId?: string): Promise<void>;
  stop(): Promise<void>;
  pause(): void;
  resume(): void;
  getCameras(): Promise<{ id: string; label: string }[]>;
  setTorch(enabled: boolean): Promise<void>;
  hasTorch(): boolean;
}
