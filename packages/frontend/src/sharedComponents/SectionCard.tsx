import React from "react";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, className }) => (
  <section className={`card bg-base-200 shadow-lg ${className ?? ""}`}>
    <div className="card-body">
      <h2 className="card-title text-2xl mb-2">{title}</h2>
      {children}
    </div>
  </section>
);

export default SectionCard;
