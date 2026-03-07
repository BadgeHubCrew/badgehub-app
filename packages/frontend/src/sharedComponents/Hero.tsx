import React from "react";
import { MLink } from "@sharedComponents/MLink.tsx";

const Hero: React.FC = () => (
  <section className="text-center mb-12 pt-8">
    <h1 className="text-4xl sm:text-5xl font-bold mb-4">
      Share. Build. Innovate.
    </h1>
    <p className="text-lg opacity-60 mb-8 max-w-2xl mx-auto">
      Badge applications at your fingertips. Discover projects or contribute
      your own.
    </p>
    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
      <a
        href="#apps-grid"
        onClick={(e) => {
          e.preventDefault();
          document
            .getElementById("apps-grid")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
        className="btn btn-primary btn-lg"
      >
        Explore Projects
      </a>
      <MLink
        to="/page/create-project"
        className="btn btn-neutral btn-lg"
      >
        Upload Your Creation
      </MLink>
    </div>
  </section>
);

export default Hero;
