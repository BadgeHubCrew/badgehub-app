import React from "react";

const Spinner: React.FC = () => (
  <div
    className="flex justify-center items-center py-10"
    data-testid="loading-spinner"
  >
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
  </div>
);

export default Spinner;
