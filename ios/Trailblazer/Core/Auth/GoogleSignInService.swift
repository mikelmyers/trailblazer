import Foundation
import AuthenticationServices

@Observable
final class GoogleSignInService: NSObject, ASWebAuthenticationPresentationContextProviding {
    var isAuthenticating = false

    func signIn(baseURL: URL) async throws {
        isAuthenticating = true
        defer { isAuthenticating = false }

        let signInURL = baseURL.appendingPathComponent("/api/auth/signin/google")
        let callbackScheme = "trailblazer"

        return try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: signInURL,
                callbackURLScheme: callbackScheme
            ) { callbackURL, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                // The callback URL will contain the session cookie
                // The ASWebAuthenticationSession shares cookies with the app
                continuation.resume()
            }

            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false

            DispatchQueue.main.async {
                session.start()
            }
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        ASPresentationAnchor()
    }
}
