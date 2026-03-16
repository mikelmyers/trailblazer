import UIKit
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("APNs device token: \(token)")
        // TODO: Send token to backend when push endpoint is available
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for push notifications: \(error)")
    }

    // MARK: - UNUserNotificationCenterDelegate

    /// Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .badge, .sound])
    }

    /// Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        handleNotification(userInfo: userInfo)
        completionHandler()
    }

    private func handleNotification(userInfo: [AnyHashable: Any]) {
        guard let type = userInfo["type"] as? String else { return }
        switch type {
        case "JOB_AVAILABLE":
            NotificationCenter.default.post(name: .navigateToAvailableJobs, object: nil)
        case "JOB_STATUS_UPDATE":
            if let jobId = userInfo["jobId"] as? String {
                NotificationCenter.default.post(name: .navigateToJobDetail, object: nil, userInfo: ["jobId": jobId])
            }
        case "DELIVERY_CONFIRMED":
            if let jobId = userInfo["jobId"] as? String {
                NotificationCenter.default.post(name: .navigateToJobDetail, object: nil, userInfo: ["jobId": jobId])
            }
        default:
            break
        }
    }
}

extension Notification.Name {
    static let navigateToAvailableJobs = Notification.Name("navigateToAvailableJobs")
    static let navigateToJobDetail = Notification.Name("navigateToJobDetail")
    static let driverAvailabilityChanged = Notification.Name("driverAvailabilityChanged")
}
