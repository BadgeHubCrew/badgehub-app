import React from "react";
import { DraftProjectErrorCode } from "@utils/draftProjectErrors.ts";

const AppEditStateView: React.FC<{
  loading: boolean;
  error: DraftProjectErrorCode | null;
  onLogin?: () => void;
  children: React.ReactNode;
}> = ({ loading, error, onLogin, children }) => {
  if (!loading && error) {
    return (
      <div
        data-testid="app-edit-error"
        className="flex flex-col justify-center items-center h-64 text-center"
      >
        {error === "authentication" ? (
          <>
            <div className="text-warning text-xl mb-4">
              Authentication Required
            </div>
            <div className="opacity-70 mb-4">
              You need to log in to edit this project.
            </div>
            <button
              onClick={onLogin}
              className="btn btn-primary"
            >
              Log In
            </button>
          </>
        ) : error === "not_found" ? (
          <div className="text-error">App not found.</div>
        ) : (
          <div className="text-error">
            Failed to load project. Please try again.
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 opacity-70">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
};

export default AppEditStateView;
