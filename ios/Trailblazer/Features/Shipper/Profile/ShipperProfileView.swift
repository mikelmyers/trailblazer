import SwiftUI

struct ShipperProfileView: View {
    @State private var viewModel = ShipperProfileViewModel()
    @State private var isEditing = false
    @Environment(AuthManager.self) private var authManager

    var body: some View {
        List {
            if let shipper = viewModel.shipper {
                Section {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(shipper.companyName)
                                .font(.title3.bold())
                            Text(authManager.currentUser?.email ?? "")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        SubscriptionBadgeView(tier: shipper.subscriptionTier.displayName)
                    }
                }

                Section("Company") {
                    if isEditing {
                        TextField("Company Name", text: $viewModel.companyName)
                    } else {
                        LabeledContent("Company Name", value: shipper.companyName)
                    }
                    LabeledContent("Email", value: authManager.currentUser?.email ?? "-")
                }

                Section("Subscription") {
                    NavigationLink {
                        ShipperSubscriptionView()
                    } label: {
                        HStack {
                            Text("Plan")
                            Spacer()
                            SubscriptionBadgeView(tier: shipper.subscriptionTier.displayName)
                        }
                    }

                    LabeledContent("Jobs This Month", value: "\(shipper.monthlyJobCount)")
                }

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

            if let success = viewModel.successMessage {
                Section {
                    Text(success)
                        .foregroundStyle(Color.Brand.success)
                        .font(.subheadline)
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
