import SwiftUI

struct PostJobView: View {
    @State private var viewModel = PostJobViewModel()
    @State private var showPickupSearch = false
    @State private var showDropoffSearch = false
    @State private var jobPosted = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            // Step Indicator
            HStack(spacing: 4) {
                ForEach(0..<viewModel.totalSteps, id: \.self) { step in
                    Capsule()
                        .fill(step <= viewModel.currentStep ? Color.Brand.primary : Color(.systemGray4))
                        .frame(height: 4)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)

            TabView(selection: $viewModel.currentStep) {
                // Step 1: Pickup Address
                stepView(title: "Pickup Location") {
                    AddressButton(
                        label: "Pickup Address",
                        address: viewModel.pickupAddress,
                        icon: "arrow.up.circle.fill",
                        color: .Brand.success
                    ) {
                        showPickupSearch = true
                    }

                    if viewModel.pickupLat != nil {
                        Button("Next") {
                            withAnimation { viewModel.currentStep = 1 }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(Color.Brand.primary)
                    }
                }
                .tag(0)

                // Step 2: Dropoff Address
                stepView(title: "Dropoff Location") {
                    AddressButton(
                        label: "Dropoff Address",
                        address: viewModel.dropoffAddress,
                        icon: "arrow.down.circle.fill",
                        color: .Brand.error
                    ) {
                        showDropoffSearch = true
                    }

                    if viewModel.dropoffLat != nil {
                        Button("Next") {
                            withAnimation { viewModel.currentStep = 2 }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(Color.Brand.primary)
                    }
                }
                .tag(1)

                // Step 3: Package Details
                PackageDetailsView(viewModel: viewModel)
                    .tag(2)

                // Step 4: Price Confirmation
                PriceConfirmationView(viewModel: viewModel, onSubmit: {
                    Task {
                        if await viewModel.submitJob() {
                            jobPosted = true
                        }
                    }
                })
                .tag(3)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut, value: viewModel.currentStep)
        }
        .navigationTitle("Post Delivery")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPickupSearch) {
            AddressSearchView { address, coordinate in
                viewModel.setPickup(address: address, coordinate: coordinate)
                showPickupSearch = false
            }
        }
        .sheet(isPresented: $showDropoffSearch) {
            AddressSearchView { address, coordinate in
                viewModel.setDropoff(address: address, coordinate: coordinate)
                showDropoffSearch = false
            }
        }
        .alert("Job Posted!", isPresented: $jobPosted) {
            Button("OK") { dismiss() }
        } message: {
            Text("Your delivery has been posted. Drivers will be matched soon.")
        }
    }

    private func stepView(title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(spacing: 24) {
            Text(title)
                .font(.title2.bold())
            content()
            Spacer()
        }
        .padding(24)
    }
}

struct AddressButton: View {
    let label: String
    let address: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .foregroundStyle(color)
                    .font(.title3)

                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(address.isEmpty ? "Tap to search" : address)
                        .font(.subheadline)
                        .foregroundStyle(address.isEmpty ? .tertiary : .primary)
                }

                Spacer()

                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.secondary)
            }
            .padding(16)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }
}
