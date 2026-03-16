import SwiftUI

struct ResetPasswordView: View {
    let token: String
    @State private var viewModel = AuthViewModel()
    @State private var resetComplete = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            if resetComplete {
                VStack(spacing: 16) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 56))
                        .foregroundStyle(Color.Brand.success)
                    Text("Password Reset!")
                        .font(.title2.bold())
                    Text("You can now sign in with your new password.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Button("Go to Sign In") { dismiss() }
                        .buttonStyle(.borderedProminent)
                }
            } else {
                Image(systemName: "lock.rotation")
                    .font(.system(size: 48))
                    .foregroundStyle(Color.Brand.primary)

                Text("New Password")
                    .font(.title2.bold())

                VStack(spacing: 16) {
                    SecureField("New Password (min 8 characters)", text: $viewModel.newPassword)
                        .textContentType(.newPassword)
                        .textFieldStyle(.roundedBorder)

                    SecureField("Confirm New Password", text: $viewModel.confirmNewPassword)
                        .textContentType(.newPassword)
                        .textFieldStyle(.roundedBorder)

                    if let error = viewModel.error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(Color.Brand.error)
                    }

                    Button {
                        Task {
                            if await viewModel.resetPassword(token: token) {
                                resetComplete = true
                            }
                        }
                    } label: {
                        Group {
                            if viewModel.isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text("Reset Password")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.Brand.primary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(!viewModel.newPasswordValid || viewModel.isLoading)
                    .opacity(viewModel.newPasswordValid ? 1 : 0.6)
                }
            }

            Spacer()
        }
        .padding(.horizontal, 24)
        .navigationTitle("Reset Password")
        .navigationBarTitleDisplayMode(.inline)
    }
}
