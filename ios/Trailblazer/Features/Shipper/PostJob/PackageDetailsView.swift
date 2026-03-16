import SwiftUI

struct PackageDetailsView: View {
    @Bindable var viewModel: PostJobViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("Package Details")
                    .font(.title2.bold())

                // Package Size
                VStack(alignment: .leading, spacing: 12) {
                    Text("Package Size")
                        .font(.subheadline.bold())

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        ForEach(PackageSize.allCases, id: \.self) { size in
                            Button {
                                viewModel.packageSize = size
                            } label: {
                                VStack(spacing: 6) {
                                    Image(systemName: iconForSize(size))
                                        .font(.title3)
                                    Text(size.displayName)
                                        .font(.subheadline)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(viewModel.packageSize == size ? Color.Brand.primary.opacity(0.1) : Color(.secondarySystemBackground))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(viewModel.packageSize == size ? Color.Brand.primary : .clear, lineWidth: 2)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                // Urgency
                VStack(alignment: .leading, spacing: 12) {
                    Text("Urgency")
                        .font(.subheadline.bold())

                    HStack(spacing: 10) {
                        ForEach(Urgency.allCases, id: \.self) { urg in
                            Button {
                                viewModel.urgency = urg
                            } label: {
                                VStack(spacing: 4) {
                                    Image(systemName: urg == .CRITICAL ? "bolt.fill" : urg == .EXPRESS ? "hare.fill" : "tortoise.fill")
                                        .foregroundStyle(Color.forUrgency(urg))
                                    Text(urg.displayName)
                                        .font(.caption)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(viewModel.urgency == urg ? Color.forUrgency(urg).opacity(0.1) : Color(.secondarySystemBackground))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(viewModel.urgency == urg ? Color.forUrgency(urg) : .clear, lineWidth: 2)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                // Description
                VStack(alignment: .leading, spacing: 8) {
                    Text("Notes (optional)")
                        .font(.subheadline.bold())
                    TextField("Special instructions...", text: $viewModel.jobDescription, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(3...6)
                }

                Button("Get Price Estimate") {
                    Task {
                        await viewModel.fetchPriceEstimate()
                        withAnimation { viewModel.currentStep = 3 }
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.Brand.primary)
                .disabled(!viewModel.canProceedToPrice || viewModel.isLoading)

                Spacer()
            }
            .padding(24)
        }
    }

    private func iconForSize(_ size: PackageSize) -> String {
        switch size {
        case .ENVELOPE: return "envelope.fill"
        case .SMALL: return "shippingbox"
        case .MEDIUM: return "shippingbox.fill"
        case .LARGE: return "cube.box.fill"
        case .PALLET: return "square.stack.3d.up.fill"
        }
    }
}
