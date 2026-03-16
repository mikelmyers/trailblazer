import Foundation

@Observable
final class ShipperSubscriptionViewModel {
    var stats: ShipperStats?
    var isLoading = false
    var checkoutURL: URL?
    var error: String?

    private let apiClient = APIClient.shared

    let tiers: [(tier: ShipperTier, description: String, features: [String])] = [
        (.CASUAL, "Pay per delivery", ["No monthly commitment", "Standard pricing", "Basic tracking"]),
        (.STARTER, "For growing businesses", ["100 jobs/month", "Priority matching", "Dashboard analytics"]),
        (.GROWTH, "Unlimited scale", ["Unlimited deliveries", "Best pricing", "Advanced analytics", "Priority support"]),
    ]

    func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            stats = try await apiClient.request(.shipperStats)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func subscribe(priceId: String) async {
        do {
            let response: StripeCheckoutResponse = try await apiClient.request(.stripeCheckout(priceId: priceId))
            checkoutURL = URL(string: response.url)
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }

    func openPortal() async {
        do {
            let response: StripePortalResponse = try await apiClient.request(.stripePortal)
            checkoutURL = URL(string: response.url)
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }
}
