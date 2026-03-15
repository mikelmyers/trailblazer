import Link from "next/link";

const driverSteps = [
  {
    number: "01",
    title: "Sign up",
    description:
      "Create your driver profile in under five minutes. Upload your credentials, set your availability, and define your preferred service area.",
  },
  {
    number: "02",
    title: "Get dispatched",
    description:
      "Our dispatch engine matches you with jobs based on your location, history, and performance score. No more bidding wars or dead miles.",
  },
  {
    number: "03",
    title: "Deliver",
    description:
      "Complete deliveries with turn-by-turn optimized routing. Earnings hit your account weekly with full transparency on every run.",
  },
];

const shipperSteps = [
  {
    number: "01",
    title: "Post a job",
    description:
      "Describe your shipment, set the pickup and drop-off, and let the network find the right driver. No phone calls, no spreadsheets.",
  },
  {
    number: "02",
    title: "Track in real time",
    description:
      "Watch your shipment move across the map with live ETAs, status updates, and proof of delivery — all in one dashboard.",
  },
  {
    number: "03",
    title: "Rate and repeat",
    description:
      "Rate your driver, review the delivery, and book again instantly. The system learns your preferences to improve every future dispatch.",
  },
];

const capabilities = [
  {
    label: "AI-OPTIMIZED ROUTING",
    title: "Every mile is calculated",
    description:
      "Routes are generated in real time using spatial intelligence that accounts for traffic, road conditions, vehicle type, and delivery windows. Drivers spend less time on the road and more time earning.",
  },
  {
    label: "COGNITIVE DISPATCH MATCHING",
    title: "The right driver, every time",
    description:
      "Dispatch decisions consider driver history, package requirements, urgency, proximity, and dozens of contextual signals. The result is faster pickups, fewer failures, and higher satisfaction on both sides.",
  },
  {
    label: "REAL-TIME NETWORK VISIBILITY",
    title: "See everything, miss nothing",
    description:
      "Shippers get a live view of their entire logistics operation. Drivers see upcoming demand. The network self-optimizes as conditions change, surfacing insights that static systems cannot.",
  },
];

const stats = [
  {
    value: "Nationwide",
    suffix: "",
    label: "Built for every corridor",
    description: "Operational across all major metropolitan and rural corridors",
  },
  {
    value: "<1",
    suffix: "s",
    label: "Dispatch architecture",
    description: "Average time from job post to driver assignment",
  },
  {
    value: "99.9",
    suffix: "%",
    label: "Uptime target",
    description: "Enterprise-grade reliability backed by redundant infrastructure",
  },
  {
    value: "3",
    suffix: " tiers",
    label: "Plans that match how you operate",
    description: "Free, Standard, and Pro — pick the tier that fits your volume",
  },
];

const pricingPreview = [
  {
    role: "Drivers",
    description: "Start free with a 12% platform fee, or subscribe from $49/mo to reduce or eliminate fees entirely.",
    cta: "View driver plans",
  },
  {
    role: "Shippers",
    description: "Plans starting at $199/mo with unlimited job posting tiers.",
    cta: "View shipper plans",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className="max-w-content mx-auto px-4 md:px-6 pt-16 pb-14 md:pt-32 md:pb-28">
          <h1 className="text-h1 md:text-display max-w-3xl">
            The cognitive last-mile dispatch network
          </h1>
          <p className="mt-6 text-body-lg text-text-secondary max-w-xl">
            Trailblazer connects drivers and shippers through intelligent
            dispatch — matching the right carrier to every load with
            AI-optimized routing and real-time visibility.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/auth/signup?role=driver"
              className="inline-flex items-center justify-center h-12 px-8 text-sm font-medium text-white bg-accent rounded hover:bg-accent/90 transition-colors"
            >
              Drive with Trailblazer
            </Link>
            <Link
              href="/auth/signup?role=shipper"
              className="inline-flex items-center justify-center h-12 px-8 text-sm font-medium text-text-primary border border-border-strong rounded hover:bg-background-2 transition-colors"
            >
              Ship with Trailblazer
            </Link>
          </div>
          <p className="mt-6 text-sm text-text-muted max-w-md">
            Now onboarding founding drivers and shippers. Limited spots in launch markets.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* How It Works */}
      <section className="bg-background">
        <div className="max-w-content mx-auto px-4 md:px-6 py-14 md:py-28">
          <p className="text-label uppercase text-text-muted tracking-wide-section">
            How It Works
          </p>
          <h2 className="mt-4 text-h2 md:text-h1">For drivers</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10">
            {driverSteps.map((step) => (
              <div key={step.number}>
                <p className="font-mono text-sm text-text-muted">{step.number}</p>
                <h3 className="mt-3 text-h3">{step.title}</h3>
                <p className="mt-3 text-body text-text-secondary">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <h2 className="mt-20 text-h1">For shippers</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10">
            {shipperSteps.map((step) => (
              <div key={step.number}>
                <p className="font-mono text-sm text-text-muted">{step.number}</p>
                <h3 className="mt-3 text-h3">{step.title}</h3>
                <p className="mt-3 text-body text-text-secondary">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Powered by Intelligence */}
      <section className="bg-background-2">
        <div className="max-w-content mx-auto px-4 md:px-6 py-14 md:py-28">
          <p className="text-label uppercase text-text-muted tracking-wide-section">
            Technology
          </p>
          <h2 className="mt-4 text-h2 md:text-h1 max-w-lg">Powered by intelligence</h2>
          <p className="mt-4 text-body-lg text-text-secondary max-w-xl">
            Every dispatch decision is informed by spatial data, historical
            patterns, and real-time network conditions. The system improves
            with every delivery.
          </p>

          <div className="mt-16 space-y-16">
            {capabilities.map((cap) => (
              <div
                key={cap.label}
                className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-12"
              >
                <p className="text-label uppercase text-text-muted tracking-wide-section pt-1">
                  {cap.label}
                </p>
                <div>
                  <h3 className="text-h2">{cap.title}</h3>
                  <p className="mt-4 text-body-lg text-text-secondary max-w-lg">
                    {cap.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Built for Scale */}
      <section className="bg-background">
        <div className="max-w-content mx-auto px-4 md:px-6 py-14 md:py-28">
          <p className="text-label uppercase text-text-muted tracking-wide-section">
            Infrastructure
          </p>
          <h2 className="mt-4 text-h2 md:text-h1">Built for scale</h2>
          <p className="mt-4 text-body-lg text-text-secondary max-w-xl">
            Trailblazer runs on infrastructure designed for high-throughput
            logistics operations. From single-driver fleets to enterprise
            networks.
          </p>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-mono text-h1 md:text-display text-text-primary">
                  {stat.value}
                  <span className="text-h2 text-text-muted">{stat.suffix}</span>
                </p>
                <p className="mt-2 text-h3">{stat.label}</p>
                <p className="mt-2 text-sm text-text-secondary">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Pricing Preview */}
      <section className="bg-background-2">
        <div className="max-w-content mx-auto px-4 md:px-6 py-14 md:py-28">
          <p className="text-label uppercase text-text-muted tracking-wide-section">
            Pricing
          </p>
          <h2 className="mt-4 text-h2 md:text-h1">Straightforward plans</h2>
          <p className="mt-4 text-body-lg text-text-secondary max-w-xl">
            Whether you drive or ship, there is a plan built for how you operate.
            No hidden fees, no long-term contracts.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {pricingPreview.map((item) => (
              <div
                key={item.role}
                className="border border-border rounded p-5 md:p-8 bg-background"
              >
                <h3 className="text-h2">{item.role}</h3>
                <p className="mt-3 text-body text-text-secondary">
                  {item.description}
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center mt-6 text-sm font-medium text-text-primary hover:text-text-secondary transition-colors"
                >
                  {item.cta}
                  <span className="ml-2" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
