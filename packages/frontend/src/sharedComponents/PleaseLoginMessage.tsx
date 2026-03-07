import React from "react";

export const PleaseLoginMessage: React.FC<{ whatToSee: string }> = ({
  whatToSee,
}) => (
  <>
    <div className="items-center justify-center text-center">
      <p>Please log in to {whatToSee}.</p>
    </div>
  </>
);
