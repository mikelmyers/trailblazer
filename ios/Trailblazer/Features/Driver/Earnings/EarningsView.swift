import SwiftUI

struct EarningsView: View {
    @State private var viewModel = EarningsViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let earnings = viewModel.earnings {
                    // Summary Cards
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        EarningsSummaryCard(
                            label: "This Week",
                            amount: earnings.weekEarnings.formattedCurrency,
                            jobs: earnings.weekJobs
                        )
                        EarningsSummaryCard(
                            label: "This Month",
                            amount: earnings.monthEarnings.formattedCurrency,
                            jobs: earnings.monthJobs
                        )
                        EarningsSummaryCard(
                            label: "All Time",
                            amount: earnings.allTimeEarnings.formattedCurrency,
                            jobs: earnings.totalJobs
                        )
                    }

                    // Total Highlight
                    VStack(spacing: 4) {
                        Text("Total Earned")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text(earnings.allTimeEarnings.formattedCurrency)
                            .font(.system(size: 40, weight: .bold, design: .rounded))
                            .foregroundStyle(Color.Brand.success)
                        Text("\(earnings.totalJobs) deliveries completed")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(24)
                    .background(Color.Brand.success.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }

                if let error = viewModel.error {
                    ErrorBannerView(message: error) { viewModel.error = nil }
                }
            }
            .padding(16)
            .redactedShimmer(when: viewModel.isLoading && viewModel.earnings == nil)
        }
        .navigationTitle("Earnings")
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }
}

struct EarningsSummaryCard: View {
    let label: String
    let amount: String
    let jobs: Int

    var body: some View {
        VStack(spacing: 6) {
            Text(amount)
                .font(.headline.monospacedDigit())
                .foregroundStyle(Color.Brand.success)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text("\(jobs) jobs")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
