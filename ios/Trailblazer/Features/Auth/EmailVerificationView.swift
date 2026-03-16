import SwiftUI

struct EmailVerificationView: View {
    let email: String
    var onDismiss: () -> Void

    @State private var viewModel = AuthViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "envelope.badge.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(Color.Brand.primary)

                Text("Check Your Email")
                    .font(.title2.bold())

                Text("We've sent a verification link to\n**\(email)**")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                if let message = viewModel.successMessage {
                    Text(message)
                        .font(.caption)
                        .foregroundStyle(Color.Brand.success)
                }

                Button {
                    viewModel.signUpEmail = email
                    Task { await viewModel.resendVerification() }
                } label: {
                    Group {
                        if viewModel.isLoading {
                            ProgressView()
                        } else {
                            Text("Resend Verification Email")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(viewModel.isLoading)

                Spacer()

                Button("Back to Sign In", action: onDismiss)
                    .font(.subheadline)
            }
            .padding(.horizontal, 24)
            .navigationTitle("Verify Email")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
