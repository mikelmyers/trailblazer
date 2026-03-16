import SwiftUI

struct DriverOnboardingView: View {
    @State private var viewModel = DriverOnboardingViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 24) {
            // Progress
            ProgressView(value: Double(viewModel.currentStep + 1), total: Double(viewModel.totalSteps))
                .tint(Color.Brand.primary)
                .padding(.horizontal)

            TabView(selection: $viewModel.currentStep) {
                // Step 1: Vehicle Type
                VStack(spacing: 24) {
                    Text("What do you drive?")
                        .font(.title2.bold())

                    ForEach(VehicleType.allCases, id: \.self) { type in
                        Button {
                            viewModel.selectedVehicleType = type
                        } label: {
                            HStack {
                                Image(systemName: iconForVehicle(type))
                                    .font(.title3)
                                    .frame(width: 32)
                                Text(type.displayName)
                                    .font(.headline)
                                Spacer()
                                if viewModel.selectedVehicleType == type {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(Color.Brand.primary)
                                }
                            }
                            .padding(14)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }

                    Spacer()

                    Button("Next") {
                        withAnimation { viewModel.currentStep = 1 }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.Brand.primary)
                }
                .padding(24)
                .tag(0)

                // Step 2: Service Areas
                VStack(spacing: 24) {
                    Text("Where do you deliver?")
                        .font(.title2.bold())

                    HStack {
                        TextField("Add area (e.g., Downtown)", text: $viewModel.newArea)
                            .textFieldStyle(.roundedBorder)
                        Button("Add") { viewModel.addServiceArea() }
                            .disabled(viewModel.newArea.isEmpty)
                    }

                    if !viewModel.serviceAreas.isEmpty {
                        FlowLayout(spacing: 8) {
                            ForEach(viewModel.serviceAreas, id: \.self) { area in
                                HStack(spacing: 4) {
                                    Text(area)
                                    Button {
                                        viewModel.removeServiceArea(area)
                                    } label: {
                                        Image(systemName: "xmark.circle.fill")
                                            .font(.caption)
                                    }
                                }
                                .font(.subheadline)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Color.Brand.primary.opacity(0.1))
                                .clipShape(Capsule())
                            }
                        }
                    }

                    Spacer()

                    Button("Next") {
                        Task {
                            if await viewModel.saveProfile() {
                                withAnimation { viewModel.currentStep = 2 }
                            }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.Brand.primary)
                    .disabled(viewModel.isLoading)
                }
                .padding(24)
                .tag(1)

                // Step 3: Stripe Connect
                VStack(spacing: 24) {
                    Text("Set Up Payouts")
                        .font(.title2.bold())

                    Image(systemName: "creditcard.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(Color.Brand.primary)

                    Text("Connect your bank account via Stripe to receive payouts for completed deliveries.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)

                    if viewModel.connectStatus {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(Color.Brand.success)
                            Text("Stripe Connected!")
                                .font(.headline)
                        }
                    }

                    Button(viewModel.connectStatus ? "Done" : "Connect Stripe") {
                        if viewModel.connectStatus {
                            dismiss()
                        } else {
                            Task { await viewModel.startStripeConnect() }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(viewModel.connectStatus ? Color.Brand.success : Color.Brand.primary)

                    if !viewModel.connectStatus {
                        Button("Skip for now") { dismiss() }
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()
                }
                .padding(24)
                .tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut, value: viewModel.currentStep)
        }
        .navigationTitle("Get Started")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $viewModel.stripeConnectURL) { url in
            SafariView(url: url)
        }
        .onAppear {
            Task { await viewModel.checkConnectStatus() }
        }
    }

    private func iconForVehicle(_ type: VehicleType) -> String {
        switch type {
        case .BIKE: return "bicycle"
        case .CAR: return "car.fill"
        case .VAN: return "van.fill"
        case .TRUCK: return "truck.box.fill"
        case .CARGO_VAN: return "box.truck.fill"
        }
    }
}
