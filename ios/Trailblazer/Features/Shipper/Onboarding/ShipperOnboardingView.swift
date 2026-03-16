import SwiftUI

struct ShipperOnboardingView: View {
    @State private var viewModel = ShipperOnboardingViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                Image(systemName: "building.2.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(Color.Brand.primary)

                Text("Set Up Your Business")
                    .font(.title2.bold())

                VStack(alignment: .leading, spacing: 8) {
                    Text("Company Name")
                        .font(.subheadline.bold())
                    TextField("Your business name", text: $viewModel.companyName)
                        .textFieldStyle(.roundedBorder)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Choose a Plan")
                        .font(.subheadline.bold())

                    ForEach(ShipperTier.allCases, id: \.self) { tier in
                        Button {
                            viewModel.selectedTier = tier
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(tier.displayName)
                                        .font(.headline)
                                    Text(tier.description)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                if viewModel.selectedTier == tier {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(Color.Brand.primary)
                                }
                            }
                            .padding(14)
                            .background(Color(.secondarySystemBackground))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(viewModel.selectedTier == tier ? Color.Brand.primary : .clear, lineWidth: 2)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }
                }

                if let error = viewModel.error {
                    ErrorBannerView(message: error) { viewModel.error = nil }
                }

                Button {
                    Task {
                        if await viewModel.submit() {
                            dismiss()
                        }
                    }
                } label: {
                    Group {
                        if viewModel.isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Get Started")
                        }
                    }
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(viewModel.isValid ? Color.Brand.primary : Color.gray.opacity(0.3))
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .disabled(!viewModel.isValid || viewModel.isLoading)
            }
            .padding(24)
        }
        .navigationTitle("Get Started")
        .navigationBarTitleDisplayMode(.inline)
    }
}
