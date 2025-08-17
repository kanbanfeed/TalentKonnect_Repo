import React from "react";

export default function DailySpotlight() {
  return (
    <section className="h-[calc(100vh-140px)]">
      <h1 className="mb-3 text-xl font-semibold">Daily Spotlight</h1>
      <iframe
        title="Daily Spotlight"
        src="/modules/daily-spotlight/index.html"
        className="w-full h-full border rounded-md"
        aria-label="Daily Spotlight dashboard"
      />
    </section>
  );
}