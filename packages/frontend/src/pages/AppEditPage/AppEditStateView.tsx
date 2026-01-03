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
        className="flex flex-col justify-center items-center h-64 text-center bg-gray-900"
      >
        {error === "authentication" ? (
          <>
            <div className="text-yellow-400 text-xl mb-4">
              Authentication Required
            </div>
            <div className="text-slate-400 mb-4">
              You need to log in to edit this project.
            </div>
            <button
              onClick={onLogin}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
            >
              Log In
            </button>
          </>
        ) : error === "not_found" ? (
          <div className="text-red-400">App not found.</div>
        ) : (
          <div className="text-red-400">
            Failed to load project. Please try again.
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400 bg-gray-900">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
};

export default AppEditStateView;
