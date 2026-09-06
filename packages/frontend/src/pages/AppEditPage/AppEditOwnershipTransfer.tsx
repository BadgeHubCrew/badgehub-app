import type React from "react";
import { useEffect, useRef, useState } from "react";

const AppEditOwnershipTransfer: React.FC<{
  onTransferOwner: (newOwnerId: string) => Promise<boolean> | boolean;
  projectOwnerId: string;
}> = ({ onTransferOwner, projectOwnerId }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const trimmedNewOwnerId = newOwnerId.trim();

  useEffect(() => {
    if (showConfirmation) cancelButtonRef.current?.focus();
  }, [showConfirmation]);

  const openConfirmation = () => {
    setTransferError(null);
    if (!trimmedNewOwnerId) {
      setTransferError("Enter the new owner's user ID.");
      return;
    }
    if (trimmedNewOwnerId === projectOwnerId) {
      setTransferError("This user already owns the project.");
      return;
    }
    setShowConfirmation(true);
  };

  const confirmTransfer = async () => {
    setIsTransferring(true);
    setTransferError(null);
    try {
      if (await onTransferOwner(trimmedNewOwnerId)) {
        setShowConfirmation(false);
        setNewOwnerId("");
      }
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="border-t border-base-300 pt-6 mt-6">
      <h3 className="font-semibold">Transfer ownership</h3>
      <p className="text-sm opacity-70 mb-3">
        Current owner: <span className="font-mono">{projectOwnerId}</span>
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="input input-bordered flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-sm opacity-70">New owner</span>
          <input
            type="text"
            className="min-w-0 grow"
            value={newOwnerId}
            onChange={(event) => {
              setNewOwnerId(event.target.value);
              setTransferError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                openConfirmation();
              }
            }}
          />
        </label>
        <button
          type="button"
          className="btn btn-warning"
          onClick={openConfirmation}
          disabled={!trimmedNewOwnerId}
        >
          Transfer
        </button>
      </div>
      {transferError && (
        <p className="text-sm text-error mt-2" role="alert">
          {transferError}
        </p>
      )}

      {showConfirmation && (
        <dialog
          open
          className="modal"
          aria-labelledby="transfer-ownership-title"
          onCancel={(event) => {
            event.preventDefault();
            setShowConfirmation(false);
          }}
        >
          <div className="modal-box">
            <h3
              id="transfer-ownership-title"
              className="text-lg font-bold text-warning"
            >
              Transfer this project?
            </h3>
            <p className="py-4">
              Ownership will move from{" "}
              <span className="font-mono">{projectOwnerId}</span> to{" "}
              <span className="font-mono">{trimmedNewOwnerId}</span>.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => setShowConfirmation(false)}
                ref={cancelButtonRef}
                disabled={isTransferring}
              >
                Keep owner
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={confirmTransfer}
                disabled={isTransferring}
                aria-busy={isTransferring}
              >
                {isTransferring && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Transfer project
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Close transfer confirmation"
            onClick={() => setShowConfirmation(false)}
          />
        </dialog>
      )}
    </div>
  );
};

export default AppEditOwnershipTransfer;
