import Foundation
import SwiftUI

@Observable @MainActor
final class AuthManager {
    static let shared = AuthManager()

    var isAuthenticated = false
    var currentUser: SessionUser?
    var isLoading = false
    var error: String?

    private let apiClient = APIClient.shared

    private init() {}

    // MARK: - Session

    func checkSession() async {
        isLoading = true
        defer { isLoading = false }

        // Check if we have a stored session cookie
        guard KeychainService.load(key: KeychainService.sessionCookieKey) != nil else {
            isAuthenticated = false
            currentUser = nil
            return
        }

        do {
            let session: SessionResponse = try await apiClient.request(.session)
            if let user = session.user {
                currentUser = user
                isAuthenticated = true
            } else {
                isAuthenticated = false
                currentUser = nil
                KeychainService.delete(key: KeychainService.sessionCookieKey)
            }
        } catch {
            isAuthenticated = false
            currentUser = nil
        }
    }

    // MARK: - Sign In

    func signIn(email: String, password: String) async throws {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            try await apiClient.signIn(email: email, password: password)
            // Verify session was established
            await checkSession()
            if !isAuthenticated {
                throw APIError.unauthorized
            }
        } catch let apiError as APIError {
            error = apiError.errorDescription
            throw apiError
        } catch {
            self.error = error.localizedDescription
            throw error
        }
    }

    // MARK: - Sign Up

    func signUp(name: String, email: String, password: String, role: String, companyName: String?) async throws {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            let _: SignUpResponse = try await apiClient.request(
                .signUp(email: email, password: password, name: name, role: role, companyName: companyName)
            )
        } catch let apiError as APIError {
            error = apiError.errorDescription
            throw apiError
        } catch {
            self.error = error.localizedDescription
            throw error
        }
    }

    // MARK: - Sign Out

    func signOut() async {
        do {
            try await apiClient.requestVoid(.signOut)
        } catch {
            // Sign out locally even if server call fails
        }
        KeychainService.deleteAll()
        isAuthenticated = false
        currentUser = nil
    }

    // MARK: - Password Reset

    func forgotPassword(email: String) async throws {
        let _: MessageResponse = try await apiClient.request(.forgotPassword(email: email))
    }

    func resetPassword(token: String, password: String) async throws {
        let _: MessageResponse = try await apiClient.request(.resetPassword(token: token, password: password))
    }

    func resendVerification(email: String) async throws {
        let _: MessageResponse = try await apiClient.request(.resendVerification(email: email))
    }
}
