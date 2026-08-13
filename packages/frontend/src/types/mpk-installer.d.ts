// mpk-installer 0.2.0 does not ship the index.d.ts named in its package.json.
// The Vite query keeps TypeScript on this local declaration while preserving
// normal package resolution in the production build.
declare module "mpk-installer?module" {
  export interface InstallProgress {
    phase:
      | "checking"
      | "removing"
      | "creating-directories"
      | "uploading"
      | "finalizing"
      | "done";
    progress: number;
    currentFile?: string;
    fileIndex?: number;
    fileCount?: number;
    bytesWritten?: number;
    totalBytes: number;
  }

  export interface WebSerialInstallResult {
    installed: boolean;
    overwritten: boolean;
    appId: string;
    location: string;
  }

  export interface WebSerialInstallOptions {
    overwrite?: boolean;
    onProgress?: (progress: InstallProgress) => void;
    port?: SerialPortLike;
  }

  export interface SerialPortLike {
    readonly readable?: ReadableStream<Uint8Array> | null;
    readonly writable?: WritableStream<Uint8Array> | null;
  }

  export function installMpkWebSerial(
    source: string,
    options?: WebSerialInstallOptions
  ): Promise<WebSerialInstallResult>;
}
