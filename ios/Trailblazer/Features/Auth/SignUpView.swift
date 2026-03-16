import SwiftUI

struct SignUpView: View {
    @State private var viewModel = AuthViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("Create Account")
                    .font(.title.bold())
                    .padding(.top, 20)

                VStack(spacing: 16) {
                    TextField("Full Name", text: $viewModel.signUpName)
                        .textContentType(.name)
                        .textFieldStyle(.roundedBorder)

                    TextField("Email", text: $viewModel.signUpEmail)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)

                    SecureField("Password (min 8 characters)", text: $viewModel.signUpPassword)
                        .textContentType(.newPassword)
                        .textFieldStyle(.roundedBorder)

                    SecureField("Confirm Password", text: $viewModel.signUpConfirmPassword)
                        .textContentType(.newPassword)
                        .textFieldStyle(.roundedBorder)

                    // Role Selection
                    VStack(alignment: .leading, spacing: 8) {
                        Text("I want to:")
                            .font(.subheadline.bold())
                        Picker("Role", selection: $viewModel.signUpRole) {
                            Text("Deliver packages").tag(Role.DRIVER)
                            Text("Ship packages").tag(Role.SHIPPER)
                        }
                        .pickerStyle(.segmented)
                    }

                    if viewModel.signUpRole == .SHIPPER {
                        TextField("Company Name", text: $viewModel.signUpCompanyName)
                            .textFieldStyle(.roundedBorder)
                            .transition(.move(edge: .top).combined(with: .opacity))
                    }

                    if let error = viewModel.error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(Color.Brand.error)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button {
                        Task {
                            if await viewModel.signUp() {
                                // Show verification screen
                            }
                        }
                    } label: {
                        Group {
                            if viewModel.isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text("Create Account")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.Brand.primary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(!viewModel.signUpValid || viewModel.isLoading)
                    .opacity(viewModel.signUpValid ? 1 : 0.6)
                }

                HStack(spacing: 4) {
                    Text("Already have an account?")
                        .foregroundStyle(.secondary)
                    Button("Sign In") { dismiss() }
                }
                .font(.subheadline)
            }
            .padding(.horizontal, 24)
        }
        .navigationTitle("Sign Up")
        .navigationBarTitleDisplayMode(.inline)
        .animation(.easeInOut, value: viewModel.signUpRole)
        .sheet(isPresented: $viewModel.showEmailVerification) {
            EmailVerificationView(email: viewModel.signUpEmail) {
                viewModel.showEmailVerification = false
                dismiss()
            }
        }
    }
}
