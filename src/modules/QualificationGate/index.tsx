import React from "react";

export default function QualificationGate() {
  return (
    <section className="h-[calc(100vh-140px)]">
      <h1 className="mb-3 text-xl font-semibold">Qualification Gate</h1>
      <iframe
        title="Qualification Gate"
        src="/modules/qualification-gate/index.html"
        className="w-full h-full border rounded-md"
        aria-label="Qualification Gate dashboard"
      />
    </section>
  );
}