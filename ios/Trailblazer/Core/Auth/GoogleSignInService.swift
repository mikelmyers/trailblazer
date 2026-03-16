import Foundation
import AuthenticationServices

@Observable
final class GoogleSignInService: NSObject, ASWebAuthenticationPresentationContextProviding {
    var isAuthenticating = false
    private var authSession: ASWebAuthenticationSession?

    func signIn(baseURL: URL) async throws {
        isAuthenticating = true
        defer { isAuthenticating = false }

        let signInURL = baseURL.appendingPathComponent("/api/auth/signin/google")
        let callbackScheme = "trailblazer"

        return try await withCheckedThrowingContinuation { [weak self] continuation in
            let session = ASWebAuthenticationSession(
                url: signInURL,
                callbackURLScheme: callbackScheme
            ) { [weak self] callbackURL, error in
                self?.authSession = nil
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume()
            }

            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            self?.authSession = session

            DispatchQueue.main.async {
                session.start()
            }
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}
