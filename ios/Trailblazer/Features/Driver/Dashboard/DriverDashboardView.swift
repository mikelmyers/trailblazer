import SwiftUI

struct DriverDashboardView: View {
    @State private var viewModel = DriverDashboardViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Availability Toggle
                AvailabilityToggleView(
                    isAvailable: .init(
                        get: { viewModel.isAvailable },
                        set: { _ in }
                    ),
                    isLoading: viewModel.isTogglingAvailability
                ) { newValue in
                    Task { await viewModel.toggleAvailability(newValue) }
                }

                // Active Job Banner
                if let activeJob = viewModel.activeJob {
                    NavigationLink(value: activeJob) {
                        ActiveJobBanner(job: activeJob)
                    }
                }

                // Stats Grid
                if let stats = viewModel.stats {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        StatsCardView(
                            icon: "shippingbox.fill",
                            value: "\(stats.todayDeliveries)",
                            label: "Today"
                        )
                        StatsCardView(
                            icon: "dollarsign.circle.fill",
                            value: stats.weekEarnings.formattedCurrency,
                            label: "This Week",
                            color: .Brand.success
                        )
                        StatsCardView(
                            icon: "star.fill",
                            value: String(format: "%.1f", stats.rating),
                            label: "Rating",
                            color: .Brand.accent
                        )
                        StatsCardView(
                            icon: "checkmark.circle.fill",
                            value: "\(stats.totalJobs)",
                            label: "Total Jobs",
                            color: .Brand.primary
                        )
                    }
                }

                // Subscription Info
                if let profile = viewModel.profile {
                    HStack {
                        Text("Subscription")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        SubscriptionBadgeView(tier: profile.subscriptionTier.displayName)
                    }
                    .padding(16)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }

                if let error = viewModel.error {
                    ErrorBannerView(message: error) {
                        viewModel.error = nil
                    }
                }
            }
            .padding(.horizontal, 16)
            .redactedShimmer(when: viewModel.isLoading && viewModel.stats == nil)
        }
        .refreshable { await viewModel.load() }
        .navigationTitle("Dashboard")
        .navigationDestination(for: Job.self) { job in
            ActiveJobView(jobId: job.id)
        }
        .task { await viewModel.load() }
    }
}

struct ActiveJobBanner: View {
    let job: Job

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "location.fill")
                .font(.title2)
                .foregroundStyle(Color.Brand.success)

            VStack(alignment: .leading, spacing: 4) {
                Text("Active Delivery")
                    .font(.headline)
                Text(job.status.displayName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .foregroundStyle(.secondary)
        }
        .padding(16)
        .background(Color.Brand.success.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
