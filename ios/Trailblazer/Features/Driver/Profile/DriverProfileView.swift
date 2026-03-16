import SwiftUI

struct DriverProfileView: View {
    @State private var viewModel = DriverProfileViewModel()
    @State private var isEditing = false
    @Environment(AuthManager.self) private var authManager

    var body: some View {
        List {
            if let driver = viewModel.driver {
                // Rating Section
                Section {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(authManager.currentUser?.name ?? "Driver")
                                .font(.title3.bold())
                            RatingStarsView(rating: driver.rating)
                            Text("\(driver.totalJobs) total deliveries")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        SubscriptionBadgeView(tier: driver.subscriptionTier.displayName)
                    }
                }

                // Vehicle & Service
                Section("Vehicle & Service") {
                    if isEditing {
                        Picker("Vehicle Type", selection: $viewModel.selectedVehicleType) {
                            ForEach(VehicleType.allCases, id: \.self) { type in
                                Text(type.displayName).tag(type)
                            }
                        }
                    } else {
                        LabeledContent("Vehicle Type", value: driver.vehicleType.displayName)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Service Areas")
                            .font(.subheadline)
                        if driver.serviceAreas.isEmpty {
                            Text("No areas set")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        } else {
                            FlowLayout(spacing: 6) {
                                ForEach(driver.serviceAreas, id: \.self) { area in
                                    Text(area)
                                        .font(.caption)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.Brand.primary.opacity(0.1))
                                        .clipShape(Capsule())
                                }
                            }
                        }
                    }
                }

                // Stripe Connect
                Section("Payouts") {
                    HStack {
                        Text("Stripe Connect")
                        Spacer()
                        Text(driver.stripeConnectOnboarded ? "Connected" : "Not Set Up")
                            .foregroundStyle(driver.stripeConnectOnboarded ? Color.Brand.success : .secondary)
                    }
                }

                // Subscription
                Section {
                    NavigationLink {
                        DriverSubscriptionView()
                    } label: {
                        HStack {
                            Text("Subscription")
                            Spacer()
                            SubscriptionBadgeView(tier: driver.subscriptionTier.displayName)
                        }
                    }
                }

                // Settings
                Section {
                    NavigationLink("Settings") {
                        SettingsView()
                    }
                }
            }

            if let error = viewModel.error {
                Section {
                    ErrorBannerView(message: error) { viewModel.error = nil }
                }
            }
        }
        .navigationTitle("Profile")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(isEditing ? "Save" : "Edit") {
                    if isEditing {
                        Task { await viewModel.save() }
                    }
                    isEditing.toggle()
                }
                .disabled(viewModel.isSaving)
            }
        }
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }
}

/// Simple flow layout for tags
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = flowLayout(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = flowLayout(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
        }
    }

    private func flowLayout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        var maxX: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
            maxX = max(maxX, x)
        }

        return (CGSize(width: maxX, height: y + rowHeight), positions)
    }
}
