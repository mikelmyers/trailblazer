import SwiftUI

struct ForgotPasswordView: View {
    @State private var viewModel = AuthViewModel()
    @State private var emailSent = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "key.fill")
                .font(.system(size: 48))
                .foregroundStyle(Color.Brand.primary)

            Text("Reset Password")
                .font(.title2.bold())

            Text("Enter your email and we'll send you a link to reset your password.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            if emailSent {
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(Color.Brand.success)
                    Text(viewModel.successMessage ?? "Reset link sent!")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            } else {
                VStack(spacing: 16) {
                    TextField("Email", text: $viewModel.resetEmail)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)

                    if let error = viewModel.error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(Color.Brand.error)
                    }

                    Button {
                        Task {
                            if await viewModel.forgotPassword() {
                                emailSent = true
                            }
                        }
                    } label: {
                        Group {
                            if viewModel.isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text("Send Reset Link")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.Brand.primary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(!viewModel.resetEmailValid || viewModel.isLoading)
                    .opacity(viewModel.resetEmailValid ? 1 : 0.6)
                }
            }

            Spacer()
        }
        .padding(.horizontal, 24)
        .navigationTitle("Forgot Password")
        .navigationBarTitleDisplayMode(.inline)
    }
}
