import SwiftUI
import SafariServices

struct DriverSubscriptionView: View {
    @State private var viewModel = DriverSubscriptionViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Current Tier
                VStack(spacing: 8) {
                    Text("Current Plan")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    SubscriptionBadgeView(tier: viewModel.currentTier.displayName)
                    Text(viewModel.currentTier.monthlyPrice + "/month")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .padding(24)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))

                // Tier Cards
                ForEach(viewModel.tiers, id: \.tier) { item in
                    TierCard(
                        tier: item.tier,
                        features: item.features,
                        isCurrent: item.tier == viewModel.currentTier,
                        onSelect: {
                            // In production, each tier has a Stripe Price ID
                            Task { await viewModel.subscribe(priceId: "price_\(item.tier.rawValue.lowercased())") }
                        }
                    )
                }

                // Manage Subscription
                if viewModel.currentTier != .FREE {
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

struct TierCard: View {
    let tier: DriverTier
    let features: [String]
    let isCurrent: Bool
    var onSelect: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(tier.displayName)
                    .font(.headline)
                Spacer()
                Text(tier.monthlyPrice)
                    .font(.title3.bold())
                Text("/mo")
                    .font(.caption)
                    .foregroundStyle(.secondary)
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

            if !isCurrent && tier != .FREE {
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

// Safari View Controller wrapper
struct SafariView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }

    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}

extension URL: @retroactive Identifiable {
    public var id: String { absoluteString }
}
