import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Trailblazer",
  description:
    "Trailblazer is built by Primordia Systems — infrastructure for the cognitive era of logistics.",
};

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-background">
        <div className="max-w-content mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <p className="text-label uppercase text-text-muted tracking-wide-section">
            About
          </p>
          <h1 className="mt-4 text-display max-w-2xl">About Trailblazer</h1>
          <p className="mt-6 text-body-lg text-text-secondary max-w-xl">
            Trailblazer is the dispatch network built by Primordia Systems for
            the next generation of last-mile logistics. We believe that freight
            matching should be instantaneous, transparent, and continuously
            improving.
          </p>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Story */}
      <section className="bg-background-2">
        <div className="max-w-content mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-16">
            <div>
              <p className="text-label uppercase text-text-muted tracking-wide-section">
                Our Story
              </p>
            </div>
            <div className="max-w-lg">
              <h2 className="text-h2">
                Logistics infrastructure has stalled. We are here to move it
                forward.
              </h2>
              <p className="mt-6 text-body-lg text-text-secondary">
                The last mile remains the most expensive, least efficient segment
                of the supply chain. Legacy dispatch systems rely on manual
                matching, static routing, and fragmented visibility. The result is
                wasted capacity, delayed deliveries, and frustrated operators on
                both sides.
              </p>
              <p className="mt-4 text-body-lg text-text-secondary">
                Primordia Systems was founded to build the infrastructure layer
                that logistics has been missing: a cognitive platform that
                understands space, time, and context at the level required to
                make dispatch decisions that are genuinely optimal — not just fast.
              </p>
              <p className="mt-4 text-body-lg text-text-secondary">
                Trailblazer is the first product built on that platform. It is a
                dispatch network that gets measurably better with every delivery,
                every rating, and every mile driven.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Powered by Terra */}
      <section className="bg-background">
        <div className="max-w-content mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-16">
            <div>
              <p className="text-label uppercase text-text-muted tracking-wide-section">
                Spatial Intelligence
              </p>
            </div>
            <div className="max-w-lg">
              <h2 className="text-h2">Powered by Terra</h2>
              <p className="mt-6 text-body-lg text-text-secondary">
                Terra is Primordia&rsquo;s spatial intelligence layer — the system
                that understands the physical world your shipments move through.
                It processes real-time traffic data, road network topology,
                weather conditions, and historical delivery patterns to generate
                routes that are not just short, but genuinely efficient.
              </p>
              <p className="mt-4 text-body-lg text-text-secondary">
                For drivers, Terra means fewer dead miles and more accurate ETAs.
                For shippers, it means network-wide visibility into where every
                shipment is, where it is going, and when it will arrive — down to
                the minute.
              </p>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div>
                  <p className="font-mono text-h2 text-text-primary">Real-time</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Routing recalculated continuously as conditions change
                  </p>
                </div>
                <div>
                  <p className="font-mono text-h2 text-text-primary">Geospatial</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Road-level precision with full network topology awareness
                  </p>
                </div>
                <div>
                  <p className="font-mono text-h2 text-text-primary">Adaptive</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Models improve with every delivery completed on the network
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Cognitive Dispatch */}
      <section className="bg-background-2">
        <div className="max-w-content mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-16">
            <div>
              <p className="text-label uppercase text-text-muted tracking-wide-section">
                Dispatch Engine
              </p>
            </div>
            <div className="max-w-lg">
              <h2 className="text-h2">Cognitive dispatch</h2>
              <p className="mt-6 text-body-lg text-text-secondary">
                Traditional dispatch assigns the nearest available driver.
                Primordia&rsquo;s dispatch engine goes further. It evaluates
                dozens of contextual signals to find the best match — not just
                the closest one.
              </p>
              <p className="mt-4 text-body-lg text-text-secondary">
                Driver history, package requirements, vehicle specifications,
                delivery urgency, traffic patterns, and reliability scores are
                all factored into every assignment. The system learns from
                outcomes: successful deliveries reinforce good patterns, while
                delays and failures are used to recalibrate matching logic in
                real time.
              </p>
              <p className="mt-4 text-body-lg text-text-secondary">
                The result is a dispatch network where match quality improves
                continuously. Drivers get jobs that suit their strengths.
                Shippers get carriers they can rely on. And the network as a
                whole becomes more efficient with every transaction.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  "Driver history and performance scoring",
                  "Package type and handling requirements",
                  "Real-time traffic and weather conditions",
                  "Delivery urgency and time-window constraints",
                  "Vehicle type and capacity matching",
                  "Historical reliability and completion rates",
                ].map((signal) => (
                  <div key={signal} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-text-primary flex-shrink-0" />
                    <p className="text-sm text-text-secondary">{signal}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Company */}
      <section className="bg-background">
        <div className="max-w-content mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-16">
            <div>
              <p className="text-label uppercase text-text-muted tracking-wide-section">
                Company
              </p>
            </div>
            <div className="max-w-lg">
              <h2 className="text-h2">Primordia Systems</h2>
              <p className="mt-6 text-body-lg text-text-secondary">
                Primordia Systems is a technology company based in the United
                States, building infrastructure for the cognitive era. Our
                platforms combine spatial intelligence, contextual reasoning,
                and real-time data processing to solve problems that require
                more than simple automation.
              </p>
              <p className="mt-4 text-body-lg text-text-secondary">
                Trailblazer is our first product — a proof that cognitive
                infrastructure can transform an industry as complex and
                physically grounded as last-mile logistics. We are a small,
                focused team that ships production systems, not prototypes.
              </p>

              <div className="mt-10 border-t border-border pt-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <p className="text-label uppercase text-text-muted tracking-wide-section">
                      Headquarters
                    </p>
                    <p className="mt-2 text-body text-text-primary">
                      United States
                    </p>
                  </div>
                  <div>
                    <p className="text-label uppercase text-text-muted tracking-wide-section">
                      Focus
                    </p>
                    <p className="mt-2 text-body text-text-primary">
                      Cognitive logistics infrastructure
                    </p>
                  </div>
                  <div>
                    <p className="text-label uppercase text-text-muted tracking-wide-section">
                      Platform
                    </p>
                    <p className="mt-2 text-body text-text-primary">
                      Terra spatial intelligence
                    </p>
                  </div>
                  <div>
                    <p className="text-label uppercase text-text-muted tracking-wide-section">
                      Product
                    </p>
                    <p className="mt-2 text-body text-text-primary">
                      Trailblazer dispatch network
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
