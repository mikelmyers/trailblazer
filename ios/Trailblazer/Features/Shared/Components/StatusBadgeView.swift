import SwiftUI

struct StatusBadgeView: View {
    let status: JobStatus

    var body: some View {
        Text(status.displayName)
            .font(.caption.bold())
            .foregroundStyle(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Color.forStatus(status))
            .clipShape(Capsule())
    }
}
