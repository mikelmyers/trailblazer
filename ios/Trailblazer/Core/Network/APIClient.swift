import Foundation

actor APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let baseURL: URL

    init(baseURL: URL = URL(string: "https://trailblazer.app")!) {
        let config = URLSessionConfiguration.default
        config.httpCookieAcceptPolicy = .always
        config.httpShouldSetCookies = true
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
        self.baseURL = baseURL
    }

    // MARK: - Public API

    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        var urlRequest = try RequestBuilder.build(endpoint: endpoint, baseURL: baseURL)
        AuthInterceptor.intercept(&urlRequest)

        let (data, response) = try await performWithRetry(urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }

        // Extract session cookie if present
        AuthInterceptor.extractSessionCookie(from: httpResponse, url: urlRequest.url!)

        try validateResponse(httpResponse, data: data)

        do {
            return try ResponseDecoder.shared.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    func requestVoid(_ endpoint: APIEndpoint) async throws {
        var urlRequest = try RequestBuilder.build(endpoint: endpoint, baseURL: baseURL)
        AuthInterceptor.intercept(&urlRequest)

        let (data, response) = try await performWithRetry(urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }

        AuthInterceptor.extractSessionCookie(from: httpResponse, url: urlRequest.url!)
        try validateResponse(httpResponse, data: data)
    }

    /// Special sign-in that uses form-encoded body for NextAuth credentials callback
    func signIn(email: String, password: String) async throws {
        // Step 1: Get CSRF token
        let csrfResponse: CSRFResponse = try await request(.csrf)

        // Step 2: POST credentials with form encoding
        var components = URLComponents(url: baseURL.appendingPathComponent("/api/auth/callback/credentials"), resolvingAgainstBaseURL: true)!
        var urlRequest = URLRequest(url: components.url!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        let formBody = "email=\(email.urlEncoded)&password=\(password.urlEncoded)&csrfToken=\(csrfResponse.csrfToken.urlEncoded)"
        urlRequest.httpBody = formBody.data(using: .utf8)

        AuthInterceptor.intercept(&urlRequest)

        // Allow redirects to be followed (NextAuth redirects after sign-in)
        let (data, response) = try await session.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }

        AuthInterceptor.extractSessionCookie(from: httpResponse, url: urlRequest.url!)

        // NextAuth may redirect (302) on success — a 200 or 302 with session cookie is success
        if httpResponse.statusCode == 401 || httpResponse.statusCode == 403 {
            let errorBody = try? ResponseDecoder.shared.decode(ErrorResponse.self, from: data)
            throw APIError.unauthorized
        }
    }

    // MARK: - Private

    private func performWithRetry(_ request: URLRequest, maxRetries: Int = 1) async throws -> (Data, URLResponse) {
        var lastError: Error?
        for attempt in 0...maxRetries {
            do {
                return try await session.data(for: request)
            } catch {
                lastError = error
                if attempt < maxRetries {
                    try await Task.sleep(nanoseconds: UInt64(pow(2.0, Double(attempt))) * 1_000_000_000)
                }
            }
        }
        throw APIError.networkError(lastError ?? URLError(.unknown))
    }

    private func validateResponse(_ response: HTTPURLResponse, data: Data) throws {
        switch response.statusCode {
        case 200...299:
            return
        case 401:
            throw APIError.unauthorized
        case 403:
            let body = try? ResponseDecoder.shared.decode(ErrorResponse.self, from: data)
            throw APIError.forbidden(body?.error ?? "Access denied.")
        case 404:
            let body = try? ResponseDecoder.shared.decode(ErrorResponse.self, from: data)
            throw APIError.notFound(body?.error ?? "Not found.")
        case 400:
            let body = try? ResponseDecoder.shared.decode(ErrorResponse.self, from: data)
            throw APIError.validation(body?.error ?? "Invalid input.", details: body?.details)
        case 500...599:
            let body = try? ResponseDecoder.shared.decode(ErrorResponse.self, from: data)
            throw APIError.serverError(body?.error ?? "Server error.")
        default:
            throw APIError.unknown
        }
    }
}

private extension String {
    var urlEncoded: String {
        addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? self
    }
}
