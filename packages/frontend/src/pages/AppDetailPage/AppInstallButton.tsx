import {
  type InstallProgress,
  installMpkWebSerial,
  type SerialPortLike,
  type WebSerialInstallResult,
} from "mpk-installer?module";
import { useState } from "react";
import type { ApiClient } from "../../api/apiClient.ts";

const INSTALLER_ID_STORAGE_KEY = "badgehub.web-installer-id";

function getInstallerId(): string {
  const storedId = localStorage.getItem(INSTALLER_ID_STORAGE_KEY);
  if (storedId) return storedId;

  const installerId = `web-installer-${crypto.randomUUID()}`;
  localStorage.setItem(INSTALLER_ID_STORAGE_KEY, installerId);
  return installerId;
}

function isTransientSerialHandshakeError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    (error.message.startsWith("Device did not enter MicroPython raw REPL:") ||
      error.message === "Timed out waiting for the badge" ||
      error.message === "Timed out waiting for a raw-REPL response")
  );
}

async function getLastAuthorizedSerialPort(): Promise<
  SerialPortLike | undefined
> {
  const serial = (
    navigator as Navigator & {
      serial?: {
        getPorts(): Promise<SerialPortLike[]>;
      };
    }
  ).serial;
  const ports = await serial?.getPorts();
  return ports?.[ports.length - 1];
}

function progressMessage(progress: InstallProgress): string {
  switch (progress.phase) {
    case "checking":
      return "Checking the badge…";
    case "removing":
      return "Removing the previous installation…";
    case "creating-directories":
      return "Preparing app folders…";
    case "uploading":
      return progress.fileIndex != null && progress.fileCount != null
        ? `Installing files (${progress.fileIndex}/${progress.fileCount})…`
        : "Installing files…";
    case "finalizing":
      return "Finalizing installation…";
    case "done":
      return "Installation complete.";
  }
}

const AppInstallButton: React.FC<{
  apiClient: ApiClient;
  mpkUrl: string;
  revision: number;
  slug: string;
}> = ({ apiClient, mpkUrl, revision, slug }) => {
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState<InstallProgress | null>(null);
  const [message, setMessage] = useState<{
    kind: "error" | "info" | "success";
    text: string;
  }>({ kind: "info", text: "Ready to install." });

  const install = async () => {
    setInstalling(true);
    setProgress(null);
    setMessage({ kind: "info", text: "Downloading and installing…" });

    try {
      // Keep this call directly in the click handler: Web Serial's device
      // picker requires an active user gesture.
      const installOptions = {
        overwrite: true,
        onProgress: (nextProgress: InstallProgress) => {
          setProgress(nextProgress);
          setMessage({ kind: "info", text: progressMessage(nextProgress) });
        },
      };
      let result: WebSerialInstallResult;
      try {
        result = await installMpkWebSerial(mpkUrl, installOptions);
      } catch (error) {
        if (!isTransientSerialHandshakeError(error)) throw error;

        const port = await getLastAuthorizedSerialPort();
        if (!port) throw error;

        setProgress(null);
        setMessage({
          kind: "info",
          text: "The serial handshake timed out. Retrying the connection…",
        });
        result = await installMpkWebSerial(mpkUrl, {
          ...installOptions,
          port,
        });
      }
      if (!result.installed) {
        setMessage({
          kind: "info",
          text: `${result.appId} was not installed.`,
        });
        return;
      }
      setMessage({
        kind: "success",
        text: `Installed ${result.appId}.`,
      });

      try {
        const report = await apiClient.reportInstall({
          params: { slug, revision },
          query: { id: getInstallerId() },
        });
        if (report.status !== 204) {
          throw new Error(`BadgeHub returned status ${report.status}`);
        }
      } catch (reportError) {
        console.error("Failed to report app installation", reportError);
        setMessage({
          kind: "success",
          text: `Installed ${result.appId}, but BadgeHub could not record the installation.`,
        });
      }
    } catch (error) {
      const text =
        error instanceof DOMException && error.name === "NotFoundError"
          ? "No device was selected."
          : error instanceof Error
            ? error.message
            : "The app could not be installed.";
      setMessage({ kind: "error", text });
    } finally {
      setInstalling(false);
    }
  };

  const progressPercentage = progress
    ? Math.round(Math.min(1, Math.max(0, progress.progress)) * 100)
    : null;

  return (
    <div className="flex flex-col items-stretch gap-2">
      <button
        type="button"
        className="btn btn-primary"
        disabled={installing}
        onClick={install}
      >
        {installing ? "Installing…" : "Install on badge"}
      </button>
      <p
        role={message.kind === "error" ? "alert" : "status"}
        className={`text-sm ${
          message.kind === "error"
            ? "text-error"
            : message.kind === "success"
              ? "text-success"
              : "opacity-70"
        }`}
      >
        {message.text}
      </p>
      {progressPercentage != null && (
        <div className="flex items-center gap-2" aria-live="polite">
          <progress
            className="progress progress-primary flex-1"
            value={progressPercentage}
            max="100"
            aria-label="Installation progress"
          />
          <span className="text-sm tabular-nums">{progressPercentage}%</span>
        </div>
      )}
    </div>
  );
};

export default AppInstallButton;
