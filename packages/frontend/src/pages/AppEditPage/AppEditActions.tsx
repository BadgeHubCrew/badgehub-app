import React from "react";
import { Link } from "react-router-dom";

interface AppEditActionsProps {
  onClickDeleteApplication: () => unknown;
}

const AppEditActions: React.FC<AppEditActionsProps> = ({
  onClickDeleteApplication,
}) => (
  <section className="card bg-base-200 shadow-lg">
    <div className="card-body">
    <h2 className="card-title text-2xl mb-4">Actions</h2>
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <button
          type="submit"
          className="btn btn-primary"
        >
          Save & Publish
        </button>
        <Link
          to=".."
          className="btn btn-neutral"
        >
          Cancel
        </Link>
      </div>
      <div>
        <button
          type="button"
          className="btn btn-error flex items-center"
          onClick={onClickDeleteApplication}
        >
          <svg
            className="icon h-5 w-5 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Delete Application
        </button>
      </div>
    </div>
    <p className="text-xs opacity-60 mt-4 text-right">
      Deleting an application is permanent and cannot be undone.
    </p>
    </div>
  </section>
);

export default AppEditActions;
