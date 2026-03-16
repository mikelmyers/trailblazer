import SwiftUI

struct RoleSelectionView: View {
    @Environment(AppState.self) private var appState
    @State private var selectedRole: Role?

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Text("How will you use Trailblazer?")
                .font(.title2.bold())
                .multilineTextAlignment(.center)

            VStack(spacing: 16) {
                RoleCard(
                    role: .DRIVER,
                    icon: "car.fill",
                    title: "I'm a Driver",
                    description: "Deliver packages and earn money on your own schedule.",
                    isSelected: selectedRole == .DRIVER
                ) {
                    selectedRole = .DRIVER
                }

                RoleCard(
                    role: .SHIPPER,
                    icon: "shippingbox.fill",
                    title: "I'm a Shipper",
                    description: "Ship packages with on-demand delivery drivers.",
                    isSelected: selectedRole == .SHIPPER
                ) {
                    selectedRole = .SHIPPER
                }
            }

            Spacer()

            Button {
                if let role = selectedRole {
                    appState.currentRole = role
                }
            } label: {
                Text("Continue")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(selectedRole != nil ? Color.Brand.primary : Color.gray.opacity(0.3))
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(selectedRole == nil)
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 32)
    }
}

struct RoleCard: View {
    let role: Role
    let icon: String
    let title: String
    let description: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 32))
                    .foregroundStyle(isSelected ? Color.Brand.primary : .secondary)
                    .frame(width: 48)

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isSelected ? Color.Brand.primary : .tertiary)
                    .font(.title3)
            }
            .padding(16)
            .background(Color(.secondarySystemBackground))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? Color.Brand.primary : .clear, lineWidth: 2)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }
}
