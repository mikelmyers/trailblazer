import Foundation

enum APIError: LocalizedError {
    case unauthorized
    case forbidden(String)
    case notFound(String)
    case validation(String, details: [String: [String]]?)
    case serverError(String)
    case networkError(Error)
    case decodingError(Error)
    case invalidURL
    case unknown

    var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "Your session has expired. Please sign in again."
        case .forbidden(let message):
            return message
        case .notFound(let message):
            return message
        case .validation(let message, _):
            return message
        case .serverError(let message):
            return message
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Data error: \(error.localizedDescription)"
        case .invalidURL:
            return "Invalid URL."
        case .unknown:
            return "Something went wrong."
        }
    }
}
