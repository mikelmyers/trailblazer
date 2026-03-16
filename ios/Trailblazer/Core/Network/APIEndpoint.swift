import Foundation

enum HTTPMethod: String {
    case GET
    case POST
    case PUT
    case PATCH
    case DELETE
}

enum APIEndpoint {
    // Auth
    case csrf
    case signIn(email: String, password: String, csrfToken: String)
    case signUp(email: String, password: String, name: String, role: String, companyName: String?)
    case signOut
    case forgotPassword(email: String)
    case resetPassword(token: String, password: String)
    case resendVerification(email: String)
    case session

    // Jobs
    case listJobs(status: String?, page: Int, limit: Int)
    case getJob(id: String)
    case createJob(CreateJobRequest)
    case updateJobStatus(id: String, status: String)
    case availableJobs
    case priceEstimate(PriceEstimateRequest)

    // Driver
    case driverMe
    case updateDriverProfile(UpdateDriverRequest)
    case updateLocation(lat: Double, lng: Double)
    case driverJobs(status: String?, page: Int, limit: Int)
    case activeJob
    case updateAvailability(isAvailable: Bool)
    case driverEarnings
    case driverStats
    case driverRecentJobs

    // Shipper
    case shipperProfile
    case updateShipperProfile(companyName: String)
    case shipperJobs(status: String?, limit: Int)
    case shipperStats
    case shipperOnboarding(companyName: String, selectedTier: String)

    // Stripe
    case stripeCheckout(priceId: String)
    case stripePortal
    case stripeConnectOnboard
    case stripeConnectStatus

    // Subscription
    case subscription

    var path: String {
        switch self {
        case .csrf: return "/api/auth/csrf"
        case .signIn: return "/api/auth/callback/credentials"
        case .signUp: return "/api/auth/signup"
        case .signOut: return "/api/auth/signout"
        case .forgotPassword: return "/api/auth/forgot-password"
        case .resetPassword: return "/api/auth/reset-password"
        case .resendVerification: return "/api/auth/resend-verification"
        case .session: return "/api/auth/session"

        case .listJobs: return "/api/jobs"
        case .getJob(let id): return "/api/jobs/\(id)"
        case .createJob: return "/api/jobs"
        case .updateJobStatus(let id, _): return "/api/jobs/\(id)"
        case .availableJobs: return "/api/jobs/available"
        case .priceEstimate: return "/api/jobs/price-estimate"

        case .driverMe, .updateDriverProfile: return "/api/drivers/me"
        case .updateLocation: return "/api/drivers/location"
        case .driverJobs: return "/api/drivers/jobs"
        case .activeJob: return "/api/drivers/active-job"
        case .updateAvailability: return "/api/drivers/availability"
        case .driverEarnings: return "/api/drivers/earnings"
        case .driverStats: return "/api/drivers/stats"
        case .driverRecentJobs: return "/api/drivers/recent-jobs"

        case .shipperProfile, .updateShipperProfile: return "/api/shipper/profile"
        case .shipperJobs: return "/api/shipper/jobs"
        case .shipperStats: return "/api/shipper/stats"
        case .shipperOnboarding: return "/api/shipper/onboarding"

        case .stripeCheckout: return "/api/stripe/checkout"
        case .stripePortal: return "/api/stripe/portal"
        case .stripeConnectOnboard: return "/api/stripe/connect/onboard"
        case .stripeConnectStatus: return "/api/stripe/connect/status"

        case .subscription: return "/api/subscription"
        }
    }

    var method: HTTPMethod {
        switch self {
        case .csrf, .session, .driverMe, .driverJobs, .activeJob, .driverEarnings, .driverStats,
             .driverRecentJobs, .listJobs, .getJob, .availableJobs, .shipperProfile, .shipperJobs,
             .shipperStats, .subscription, .stripeConnectStatus:
            return .GET
        case .signIn, .signUp, .signOut, .forgotPassword, .resetPassword, .resendVerification,
             .createJob, .priceEstimate, .stripeCheckout, .stripePortal, .stripeConnectOnboard,
             .shipperOnboarding:
            return .POST
        case .updateDriverProfile, .updateShipperProfile:
            return .PUT
        case .updateLocation, .updateAvailability, .updateJobStatus:
            return .PATCH
        }
    }

    var body: (any Encodable)? {
        switch self {
        case .signIn:
            return nil // Sign-in uses form-encoded body built in APIClient.signIn()
        case .signUp(let email, let password, let name, let role, let companyName):
            return SignUpBody(email: email, password: password, name: name, role: role, companyName: companyName)
        case .forgotPassword(let email):
            return EmailBody(email: email)
        case .resetPassword(let token, let password):
            return ResetPasswordBody(token: token, password: password)
        case .resendVerification(let email):
            return EmailBody(email: email)
        case .createJob(let request):
            return request
        case .updateJobStatus(_, let status):
            return UpdateJobStatusRequest(status: status)
        case .priceEstimate(let request):
            return request
        case .updateDriverProfile(let request):
            return request
        case .updateLocation(let lat, let lng):
            return LocationBody(currentLat: lat, currentLng: lng)
        case .updateAvailability(let isAvailable):
            return AvailabilityBody(isAvailable: isAvailable)
        case .updateShipperProfile(let companyName):
            return CompanyNameBody(companyName: companyName)
        case .shipperOnboarding(let companyName, let selectedTier):
            return ShipperOnboardingBody(companyName: companyName, selectedTier: selectedTier)
        case .stripeCheckout(let priceId):
            return PriceIdBody(priceId: priceId)
        default:
            return nil
        }
    }

    var queryItems: [URLQueryItem]? {
        switch self {
        case .listJobs(let status, let page, let limit):
            var items = [URLQueryItem(name: "page", value: "\(page)"), URLQueryItem(name: "limit", value: "\(limit)")]
            if let status { items.append(URLQueryItem(name: "status", value: status)) }
            return items
        case .driverJobs(let status, let page, let limit):
            var items = [URLQueryItem(name: "page", value: "\(page)"), URLQueryItem(name: "limit", value: "\(limit)")]
            if let status { items.append(URLQueryItem(name: "status", value: status)) }
            return items
        case .shipperJobs(let status, let limit):
            var items = [URLQueryItem(name: "limit", value: "\(limit)")]
            if let status { items.append(URLQueryItem(name: "status", value: status)) }
            return items
        default:
            return nil
        }
    }
}

// MARK: - Request Body Types

private struct SignUpBody: Encodable {
    let email: String
    let password: String
    let name: String
    let role: String
    let companyName: String?
}

private struct EmailBody: Encodable {
    let email: String
}

private struct ResetPasswordBody: Encodable {
    let token: String
    let password: String
}

private struct LocationBody: Encodable {
    let currentLat: Double
    let currentLng: Double
}

private struct AvailabilityBody: Encodable {
    let isAvailable: Bool
}

private struct CompanyNameBody: Encodable {
    let companyName: String
}

private struct ShipperOnboardingBody: Encodable {
    let companyName: String
    let selectedTier: String
}

private struct PriceIdBody: Encodable {
    let priceId: String
}
