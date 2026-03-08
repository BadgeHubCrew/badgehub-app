import React from "react";

interface FormFieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, hint, children }) => (
  <div className="form-control">
    <label htmlFor={htmlFor} className="label">
      <span className="label-text">{label}</span>
    </label>
    {children}
    {hint && (
      <label className="label">
        <span className="label-text-alt whitespace-normal break-words">{hint}</span>
      </label>
    )}
  </div>
);

export default FormField;
