import SwiftUI

struct DriverTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DriverDashboardView()
            }
            .tabItem {
                Label("Dashboard", systemImage: "square.grid.2x2.fill")
            }
            .tag(0)

            NavigationStack {
                AvailableJobsView()
            }
            .tabItem {
                Label("Jobs", systemImage: "briefcase.fill")
            }
            .tag(1)

            NavigationStack {
                EarningsView()
            }
            .tabItem {
                Label("Earnings", systemImage: "dollarsign.circle.fill")
            }
            .tag(2)

            NavigationStack {
                DriverProfileView()
            }
            .tabItem {
                Label("Profile", systemImage: "person.fill")
            }
            .tag(3)
        }
        .tint(Color.Brand.primary)
        .onReceive(NotificationCenter.default.publisher(for: .navigateToAvailableJobs)) { _ in
            selectedTab = 1
        }
    }
}
