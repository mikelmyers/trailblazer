import Foundation

enum AuthInterceptor {
    /// Attaches the session cookie from Keychain to the request
    static func intercept(_ request: inout URLRequest) {
        guard let cookieValue = KeychainService.load(key: KeychainService.sessionCookieKey) else {
            return
        }

        let cookieString = String(data: cookieValue, encoding: .utf8) ?? ""
        if let existing = request.value(forHTTPHeaderField: "Cookie") {
            request.setValue("\(existing); \(cookieString)", forHTTPHeaderField: "Cookie")
        } else {
            request.setValue(cookieString, forHTTPHeaderField: "Cookie")
        }
    }

    /// Extracts and stores the session cookie from a response
    static func extractSessionCookie(from response: HTTPURLResponse, url: URL) {
        guard let headerFields = response.allHeaderFields as? [String: String] else { return }

        let cookies = HTTPCookie.cookies(withResponseHeaderFields: headerFields, for: url)
        for cookie in cookies {
            if cookie.name.contains("session-token") || cookie.name.contains("authjs") {
                let cookieString = "\(cookie.name)=\(cookie.value)"
                if let data = cookieString.data(using: .utf8) {
                    KeychainService.save(key: KeychainService.sessionCookieKey, data: data)
                }
                return
            }
        }
    }
}
