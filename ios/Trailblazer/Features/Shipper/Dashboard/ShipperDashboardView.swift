import SwiftUI

struct ShipperDashboardView: View {
    @State private var viewModel = ShipperDashboardViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let stats = viewModel.stats {
                    // Stats Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        StatsCardView(
                            icon: "shippingbox.fill",
                            value: "\(stats.activeJobs)",
                            label: "Active Jobs",
                            color: .Brand.primary
                        )
                        StatsCardView(
                            icon: "calendar",
                            value: "\(stats.jobsThisMonth)",
                            label: "This Month",
                            color: .Brand.accent
                        )
                        StatsCardView(
                            icon: "star.fill",
                            value: String(format: "%.1f", stats.averageRating),
                            label: "Avg Rating",
                            color: .Brand.accent
                        )
                        StatsCardView(
                            icon: "crown.fill",
                            value: stats.tier.displayName,
                            label: "Plan",
                            color: .Brand.success
                        )
                    }

                    // Usage Bar
                    if let limit = stats.monthlyLimit {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Monthly Usage")
                                    .font(.subheadline.bold())
                                Spacer()
                                Text("\(stats.jobsThisMonth)/\(limit)")
                                    .font(.subheadline.monospacedDigit())
                                    .foregroundStyle(.secondary)
                            }
                            ProgressView(value: Double(stats.jobsThisMonth), total: Double(limit))
                                .tint(stats.jobsThisMonth >= limit ? Color.Brand.error : Color.Brand.primary)
                        }
                        .padding(16)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                }

                // Recent Jobs
                if !viewModel.recentJobs.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Recent Jobs")
                                .font(.headline)
                            Spacer()
                            NavigationLink("See All") {
                                ShipperJobListView()
                            }
                            .font(.subheadline)
                        }

                        ForEach(viewModel.recentJobs) { job in
                            NavigationLink(value: job) {
                                JobCardView(job: job)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                // Post Job CTA
                NavigationLink {
                    PostJobView()
                } label: {
                    Label("Post a New Delivery", systemImage: "plus.circle.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.Brand.primary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }

                if let error = viewModel.error {
                    ErrorBannerView(message: error) { viewModel.error = nil }
                }
            }
            .padding(16)
            .redactedShimmer(when: viewModel.isLoading && viewModel.stats == nil)
        }
        .navigationTitle("Dashboard")
        .navigationDestination(for: Job.self) { job in
            ShipperJobDetailView(jobId: job.id)
        }
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }
}
