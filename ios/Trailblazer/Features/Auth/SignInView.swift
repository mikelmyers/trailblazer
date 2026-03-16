import SwiftUI

struct SignInView: View {
    @State private var viewModel = AuthViewModel()
    @Environment(AuthManager.self) private var authManager

    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                // Logo
                VStack(spacing: 8) {
                    Image(systemName: "shippingbox.fill")
                        .font(.system(size: 56))
                        .foregroundStyle(Color.Brand.primary)
                    Text("Trailblazer")
                        .font(.largeTitle.bold())
                    Text("Last-mile delivery, simplified")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 40)

                // Form
                VStack(spacing: 16) {
                    TextField("Email", text: $viewModel.signInEmail)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)

                    SecureField("Password", text: $viewModel.signInPassword)
                        .textContentType(.password)
                        .textFieldStyle(.roundedBorder)

                    if let error = viewModel.error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(Color.Brand.error)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button {
                        Task {
                            await viewModel.signIn()
                        }
                    } label: {
                        Group {
                            if viewModel.isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Sign In")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.Brand.primary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(!viewModel.signInValid || viewModel.isLoading)
                    .opacity(viewModel.signInValid ? 1 : 0.6)
                }

                // Divider
                HStack {
                    Rectangle().frame(height: 1).foregroundStyle(.quaternary)
                    Text("or").font(.caption).foregroundStyle(.secondary)
                    Rectangle().frame(height: 1).foregroundStyle(.quaternary)
                }

                // Google Sign In
                Button {
                    // Google OAuth via ASWebAuthenticationSession
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "globe")
                        Text("Continue with Google")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                // Links
                VStack(spacing: 12) {
                    NavigationLink("Forgot Password?") {
                        ForgotPasswordView()
                    }
                    .font(.subheadline)

                    HStack(spacing: 4) {
                        Text("Don't have an account?")
                            .foregroundStyle(.secondary)
                        NavigationLink("Sign Up") {
                            SignUpView()
                        }
                    }
                    .font(.subheadline)
                }
            }
            .padding(.horizontal, 24)
        }
        .navigationBarHidden(true)
    }
}
