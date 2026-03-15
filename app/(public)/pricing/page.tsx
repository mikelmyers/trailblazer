import type { Metadata } from "next";
import Link from "next/link";
import TierCalculator from "./tier-calculator";

export const metadata: Metadata = {
  title: "Pricing — Trailblazer",
  description:
    "Simple, transparent pricing for drivers and shippers on the Trailblazer dispatch network.",
};

interface Plan {
  name: string;
  price: number | string;
  interval: string;
  description: string;
  features: string[];
  recommended?: boolean;
  badge?: string;
}

const driverPlans: Plan[] = [
  {
    name: "Driver Free",
    price: 0,
    interval: "",
    description: "Start earning with zero monthly commitment.",
    badge: "No credit card required",
    features: [
      "Listed in dispatch network",
      "Real-time job notifications",
      "Basic earnings dashboard",
      "12% platform fee per completed job",
      "Weekly direct deposit payouts",
    ],
  },
  {
    name: "Driver Standard",
    price: 49,
    interval: "/mo",
    description: "Lower fees for drivers with consistent volume.",
    features: [
      "Everything in Free",
      "6% platform fee per completed job",
      "Advanced earnings dashboard",
      "In-app navigation",
      "Fee pays for itself at 9+ jobs/month",
    ],
  },
  {
    name: "Driver Pro",
    price: 99,
    interval: "/mo",
    description: "Zero platform fees and priority access for full-time drivers.",
    recommended: true,
    features: [
      "Everything in Standard",
      "0% platform fee",
      "Priority dispatch weighting",
      "Performance insights and scoring",
      "Dedicated driver support line",
      "Breaks even vs Standard at 14+ jobs/month",
    ],
  },
];

const shipperPlans: Plan[] = [
  {
    name: "Shipper Starter",
    price: 199,
    interval: "/mo",
    description: "For businesses getting started with on-demand delivery.",
    features: [
      "Up to 50 jobs per month",
      "Basic shipment visibility",
      "Standard dispatch matching",
      "Email notifications",
      "Delivery confirmation and proof",
    ],
  },
  {
    name: "Shipper Growth",
    price: 399,
    interval: "/mo",
    description: "Unlimited capacity with full network visibility and priority.",
    features: [
      "Unlimited job postings",
      "Full real-time tracking dashboard",
      "Priority dispatch matching",
      "Dedicated account support",
      "Custom reporting and exports",
      "API access for integrations",
    ],
    recommended: true,
  },
];

const faqs = [
  {
    question: "Can I switch plans at any time?",
    answer:
      "Yes. You can upgrade or downgrade your plan at any time from your account settings. Changes take effect at the start of your next billing cycle, and any prorated amounts are handled automatically.",
  },
  {
    question: "Is there a contract or commitment?",
    answer:
      "No. All plans are month-to-month with no long-term commitment. You can cancel anytime, and your access continues through the end of your current billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards. For Shipper Growth plans, we also support ACH bank transfers and invoicing for annual commitments.",
  },
  {
    question: "Do drivers pay per delivery?",
    answer:
      "It depends on your plan. Free tier drivers pay a 12% platform fee per completed job — no monthly commitment. Standard tier reduces that to 6% with a $49/month subscription. Pro tier eliminates all per-job fees for $99/month. The calculator above shows exactly which plan saves you the most based on your delivery volume.",
  },
  {
    question: "Can I start on the Free tier and upgrade later?",
    answer:
      "Yes. All drivers start on Free by default — no credit card required. You can upgrade to Standard or Pro at any time from your account dashboard. Upgrades take effect immediately.",
  },
  {
    question: "What happens if I exceed 50 jobs on the Shipper Starter plan?",
    answer:
      "You will receive a notification when approaching your limit. Additional jobs beyond 50 are billed at $5 each, or you can upgrade to the Growth plan for unlimited access at any time.",
  },
  {
    question: "Do you offer enterprise pricing?",
    answer:
      "Yes. For organizations with high-volume logistics needs or custom integration requirements, contact our team for a tailored plan. We offer volume discounts, SLA guarantees, and dedicated infrastructure.",
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  const displayPrice = typeof plan.price === "number" && plan.price === 0 ? "Free" : `$${plan.price}`;
  const showInterval = typeof plan.price === "number" && plan.price > 0;

  return (
    <div
      className={`relative border rounded p-8 bg-background flex flex-col ${
        plan.recommended ? "border-accent" : "border-border"
      }`}
    >
      {plan.recommended && (
        <span className="absolute -top-3 left-6 bg-accent text-white text-label uppercase tracking-wide-label px-3 py-1 rounded-sm">
          Recommended
        </span>
      )}

      <h3 className="text-h3">{plan.name}</h3>
      <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-mono text-h1">{displayPrice}</span>
        {showInterval && (
          <span className="text-sm text-text-muted">{plan.interval}</span>
        )}
      </div>

      {plan.badge && (
        <p className="mt-2 text-xs text-text-muted">{plan.badge}</p>
      )}

      <ul className="mt-8 space-y-3 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
            <svg
              className="w-4 h-4 mt-0.5 text-text-primary flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href="/auth/signup"
        className={`mt-8 inline-flex items-center justify-center h-11 px-6 text-sm font-medium rounded transition-colors ${
          plan.recommended
            ? "bg-accent text-white hover:bg-accent/90"
            : "border border-border-strong text-text-primary hover:bg-background-2"
        }`}
      >
        Get started
      </Link>
    </div>
  );
}

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-background">
        <div className="max-w-content mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <p className="text-label uppercase text-text-muted tracking-wide-section">
            Pricing
          </p>
          <h1 className="mt-4 text-display max-w-xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-body-lg text-text-secondary max-w-lg">
            No hidden fees, no long-term contracts.
            Pick the plan that fits how you operate.
          </p>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Driver Plans */}
      <section className="bg-background-2">
        <div className="max-w-content mx-auto px-6 py-20 md:py-28">
          <p className="text-label uppercase text-text-muted tracking-wide-section">
            For Drivers
          </p>
          <h2 className="mt-4 text-h1">Driver plans</h2>
          <p className="mt-4 text-body-lg text-text-secondary max-w-lg">
            Join the dispatch network and start receiving jobs matched to your
            location, availability, and performance history.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {driverPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>

          {/* Tier Calculator */}
          <div className="mt-16">
            <TierCalculator />
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Shipper Plans */}
      <section className="bg-background">
        <div className="max-w-content mx-auto px-6 py-20 md:py-28">
          <p className="text-label uppercase text-text-muted tracking-wide-section">
            For Shippers
          </p>
          <h2 className="mt-4 text-h1">Shipper plans</h2>
          <p className="mt-4 text-body-lg text-text-secondary max-w-lg">
            Post jobs to the network and let intelligent dispatch find the best
            driver for every shipment. Full visibility from pickup to proof of
            delivery.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {shipperPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* FAQ */}
      <section className="bg-background-2">
        <div className="max-w-content mx-auto px-6 py-20 md:py-28">
          <p className="text-label uppercase text-text-muted tracking-wide-section">
            FAQ
          </p>
          <h2 className="mt-4 text-h1">Frequently asked questions</h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-h3">{faq.question}</h3>
                <p className="mt-3 text-body text-text-secondary">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
