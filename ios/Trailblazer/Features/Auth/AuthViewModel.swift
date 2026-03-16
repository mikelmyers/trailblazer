import Foundation
import SwiftUI

@Observable
final class AuthViewModel {
    // Sign In
    var signInEmail = ""
    var signInPassword = ""

    // Sign Up
    var signUpName = ""
    var signUpEmail = ""
    var signUpPassword = ""
    var signUpConfirmPassword = ""
    var signUpRole: Role = .DRIVER
    var signUpCompanyName = ""

    // Forgot Password
    var resetEmail = ""

    // Reset Password
    var newPassword = ""
    var confirmNewPassword = ""

    // State
    var isLoading = false
    var error: String?
    var successMessage: String?
    var showEmailVerification = false

    private let authManager = AuthManager.shared

    // MARK: - Validation

    var signInValid: Bool {
        !signInEmail.isEmpty && !signInPassword.isEmpty
    }

    var signUpValid: Bool {
        !signUpName.isEmpty &&
        !signUpEmail.isEmpty &&
        signUpPassword.count >= 8 &&
        signUpPassword == signUpConfirmPassword &&
        (signUpRole != .SHIPPER || !signUpCompanyName.isEmpty)
    }

    var resetEmailValid: Bool {
        !resetEmail.isEmpty && resetEmail.contains("@")
    }

    var newPasswordValid: Bool {
        newPassword.count >= 8 && newPassword == confirmNewPassword
    }

    // MARK: - Actions

    func signIn() async -> Bool {
        guard signInValid else {
            error = "Please fill in all fields."
            return false
        }

        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            try await authManager.signIn(email: signInEmail, password: signInPassword)
            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            return false
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func signUp() async -> Bool {
        guard signUpValid else {
            if signUpPassword != signUpConfirmPassword {
                error = "Passwords do not match."
            } else if signUpPassword.count < 8 {
                error = "Password must be at least 8 characters."
            } else {
                error = "Please fill in all required fields."
            }
            return false
        }

        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let companyName = signUpRole == .SHIPPER ? signUpCompanyName : nil
            try await authManager.signUp(
                name: signUpName,
                email: signUpEmail,
                password: signUpPassword,
                role: signUpRole.rawValue,
                companyName: companyName
            )
            showEmailVerification = true
            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            return false
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func forgotPassword() async -> Bool {
        guard resetEmailValid else {
            error = "Please enter a valid email address."
            return false
        }

        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            try await authManager.forgotPassword(email: resetEmail)
            successMessage = "Password reset link sent to your email."
            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            return false
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func resetPassword(token: String) async -> Bool {
        guard newPasswordValid else {
            if newPassword.count < 8 {
                error = "Password must be at least 8 characters."
            } else {
                error = "Passwords do not match."
            }
            return false
        }

        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            try await authManager.resetPassword(token: token, password: newPassword)
            successMessage = "Password reset successfully. Please sign in."
            return true
        } catch let apiError as APIError {
            error = apiError.errorDescription
            return false
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func resendVerification() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            try await authManager.resendVerification(email: signUpEmail)
            successMessage = "Verification email sent."
        } catch {
            self.error = "Failed to resend verification email."
        }
    }

    func clearError() {
        error = nil
    }
}
