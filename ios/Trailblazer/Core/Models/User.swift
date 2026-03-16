import Foundation

enum Role: String, Codable, CaseIterable {
    case DRIVER
    case SHIPPER
    case ADMIN
}

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String?
    let image: String?
    let role: Role
    let createdAt: Date?
    let emailVerified: Date?
}

struct SessionUser: Codable {
    let id: String
    let email: String
    let name: String?
    let role: String
    let image: String?
}

struct SessionResponse: Codable {
    let user: SessionUser?
}
