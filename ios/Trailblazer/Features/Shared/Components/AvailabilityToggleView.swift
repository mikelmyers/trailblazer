import SwiftUI

struct AvailabilityToggleView: View {
    @Binding var isAvailable: Bool
    var isLoading: Bool = false
    var onToggle: (Bool) -> Void

    var body: some View {
        Button {
            onToggle(!isAvailable)
        } label: {
            HStack(spacing: 12) {
                Circle()
                    .fill(isAvailable ? Color.Brand.success : Color(.systemGray4))
                    .frame(width: 12, height: 12)
                    .overlay {
                        if isAvailable {
                            Circle()
                                .stroke(Color.Brand.success.opacity(0.3), lineWidth: 4)
                                .frame(width: 20, height: 20)
                        }
                    }

                Text(isAvailable ? "Online" : "Offline")
                    .font(.headline)
                    .foregroundStyle(isAvailable ? Color.Brand.success : .secondary)

                Spacer()

                if isLoading {
                    ProgressView()
                } else {
                    Toggle("", isOn: .constant(isAvailable))
                        .labelsHidden()
                        .tint(Color.Brand.success)
                        .allowsHitTesting(false)
                }
            }
            .padding(16)
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
        .disabled(isLoading)
        .sensoryFeedback(.impact, trigger: isAvailable)
    }
}
