import React from "react";
import Header from "@sharedComponents/Header.tsx";
import Footer from "@sharedComponents/Footer.tsx";

interface PageLayoutProps {
  children: React.ReactNode;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  "data-testid"?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  searchQuery,
  setSearchQuery,
  "data-testid": testId,
}) => (
  <div className="min-h-screen flex flex-col" data-testid={testId}>
    <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
      {children}
    </main>
    <Footer />
  </div>
);

export default PageLayout;
