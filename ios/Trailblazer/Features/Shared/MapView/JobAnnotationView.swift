import SwiftUI

struct JobAnnotationView: View {
    enum AnnotationType {
        case pickup, dropoff
    }

    let type: AnnotationType

    var body: some View {
        ZStack {
            Circle()
                .fill(type == .pickup ? Color.Brand.success : Color.Brand.error)
                .frame(width: 32, height: 32)
                .shadow(color: .black.opacity(0.2), radius: 4, y: 2)

            Image(systemName: type == .pickup ? "arrow.up" : "arrow.down")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
        }
    }
}
