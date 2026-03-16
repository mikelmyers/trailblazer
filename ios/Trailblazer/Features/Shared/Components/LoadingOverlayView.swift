import SwiftUI

struct LoadingOverlayView: View {
    var message: String?

    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                ProgressView()
                    .scaleEffect(1.2)
                if let message {
                    Text(message)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(32)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 20))
        }
    }
}

extension View {
    func loadingOverlay(isPresented: Bool, message: String? = nil) -> some View {
        self.overlay {
            if isPresented {
                LoadingOverlayView(message: message)
            }
        }
    }
}
