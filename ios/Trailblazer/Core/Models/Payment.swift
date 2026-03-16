import Foundation

struct Payment: Codable, Identifiable {
    let id: String
    let jobId: String
    let stripePaymentIntentId: String
    let stripeTransferId: String?
    let amountCents: Int
    let platformFeeCents: Int
    let driverPayoutCents: Int
    let currency: String
    let status: String
    let capturedAt: Date?
    let transferredAt: Date?
    let createdAt: Date?
}
