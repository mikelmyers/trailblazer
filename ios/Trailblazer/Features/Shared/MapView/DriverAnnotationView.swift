import SwiftUI

struct DriverAnnotationView: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(Color.Brand.primary)
                .frame(width: 36, height: 36)
                .shadow(color: .black.opacity(0.25), radius: 4, y: 2)

            Image(systemName: "car.fill")
                .font(.system(size: 16))
                .foregroundStyle(.white)
        }
    }
}
