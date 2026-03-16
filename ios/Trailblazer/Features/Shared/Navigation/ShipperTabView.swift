import SwiftUI

struct ShipperTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                ShipperDashboardView()
            }
            .tabItem {
                Label("Dashboard", systemImage: "square.grid.2x2.fill")
            }
            .tag(0)

            NavigationStack {
                PostJobView()
            }
            .tabItem {
                Label("Post Job", systemImage: "plus.circle.fill")
            }
            .tag(1)

            NavigationStack {
                ShipperJobListView()
            }
            .tabItem {
                Label("My Jobs", systemImage: "list.clipboard.fill")
            }
            .tag(2)

            NavigationStack {
                ShipperProfileView()
            }
            .tabItem {
                Label("Profile", systemImage: "person.fill")
            }
            .tag(3)
        }
        .tint(Color.Brand.primary)
    }
}
