import SwiftUI

struct ShipperSubscriptionView: View {
    @State private var viewModel = ShipperSubscriptionViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let stats = viewModel.stats {
                    // Current Plan
                    VStack(spacing: 8) {
                        Text("Current Plan")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        SubscriptionBadgeView(tier: stats.tier.displayName)

                        if let limit = stats.monthlyLimit {
                            ProgressView(value: Double(stats.jobsThisMonth), total: Double(limit))
                                .tint(Color.Brand.primary)
                                .padding(.horizontal, 32)
                            Text("\(stats.jobsThisMonth) / \(limit) jobs this month")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(24)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }

                // Tier Cards
                ForEach(viewModel.tiers, id: \.tier) { item in
                    ShipperTierCard(
                        tier: item.tier,
                        description: item.description,
                        features: item.features,
                        isCurrent: item.tier == viewModel.stats?.tier,
                        onSelect: {
                            Task { await viewModel.subscribe(priceId: "price_shipper_\(item.tier.rawValue.lowercased())") }
                        }
                    )
                }

                if viewModel.stats?.tier != .CASUAL {
                    Button {
                        Task { await viewModel.openPortal() }
                    } label: {
                        Text("Manage Subscription")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }

                if let error = viewModel.error {
                    ErrorBannerView(message: error) { viewModel.error = nil }
                }
            }
            .padding(16)
        }
        .navigationTitle("Subscription")
        .sheet(item: $viewModel.checkoutURL) { url in
            SafariView(url: url)
        }
        .task { await viewModel.load() }
    }
}

struct ShipperTierCard: View {
    let tier: ShipperTier
    let description: String
    let features: [String]
    let isCurrent: Bool
    var onSelect: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    Text(tier.displayName)
                        .font(.headline)
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }

            ForEach(features, id: \.self) { feature in
                HStack(spacing: 8) {
                    Image(systemName: "checkmark")
                        .font(.caption)
                        .foregroundStyle(Color.Brand.success)
                    Text(feature)
                        .font(.subheadline)
                }
            }

            if !isCurrent && tier != .CASUAL {
                Button("Upgrade", action: onSelect)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.Brand.primary)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            } else if isCurrent {
                Text("Current Plan")
                    .font(.subheadline.bold())
                    .foregroundStyle(Color.Brand.success)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(16)
        .background(Color(.secondarySystemBackground))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isCurrent ? Color.Brand.primary : .clear, lineWidth: 2)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
