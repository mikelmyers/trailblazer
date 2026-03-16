import Foundation

@Observable
final class DriverSubscriptionViewModel {
    var currentTier: DriverTier = .FREE
    var subscriptionStatus: String?
    var isLoading = false
    var checkoutURL: URL?
    var error: String?

    private let apiClient = APIClient.shared

    let tiers: [(tier: DriverTier, features: [String])] = [
        (.FREE, ["Browse available jobs", "Basic profile"]),
        (.STANDARD, ["Go online & accept jobs", "Priority matching", "Earnings dashboard", "Route optimization"]),
        (.PRO, ["Everything in Standard", "Top priority dispatch", "Advanced analytics", "Premium support"]),
    ]

    func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let response: DriverResponse = try await apiClient.request(.driverMe)
            currentTier = response.driver.subscriptionTier
            subscriptionStatus = response.driver.subscriptionStatus
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
