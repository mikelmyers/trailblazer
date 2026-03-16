import SwiftUI

struct MainTabView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        Group {
            switch appState.currentRole {
            case .DRIVER:
                DriverTabView()
            case .SHIPPER:
                ShipperTabView()
            case .ADMIN, .none:
                RoleSelectionView()
            }
        }
    }
}
