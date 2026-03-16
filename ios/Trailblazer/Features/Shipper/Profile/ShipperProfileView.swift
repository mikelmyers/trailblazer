import SwiftUI

struct ShipperProfileView: View {
    @State private var viewModel = ShipperProfileViewModel()
    @State private var isEditing = false
    @Environment(AuthManager.self) private var authManager

    var body: some View {
        List {
            Section {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(viewModel.companyName.isEmpty ? "Company" : viewModel.companyName)
                            .font(.title3.bold())
                        Text(viewModel.contactEmail ?? authManager.currentUser?.email ?? "")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }
            }

            Section("Company") {
                if isEditing {
                    TextField("Company Name", text: $viewModel.companyName)
                } else {
                    LabeledContent("Company Name", value: viewModel.companyName)
                }
                LabeledContent("Email", value: viewModel.contactEmail ?? authManager.currentUser?.email ?? "-")
            }

            Section("Subscription") {
                NavigationLink {
                    ShipperSubscriptionView()
                } label: {
                    Text("Manage Subscription")
                }
            }

            Section {
                NavigationLink("Settings") {
                    SettingsView()
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
        .redactedShimmer(when: viewModel.isLoading && viewModel.companyName.isEmpty)
        .refreshable { await viewModel.load() }
        .task { await viewModel.load() }
    }
}
