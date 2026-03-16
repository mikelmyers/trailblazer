import SwiftUI

struct RatingStarsView: View {
    let rating: Double
    var maxRating: Int = 5
    var starSize: CGFloat = 16
    var interactive: Bool = false
    var onRatingChanged: ((Int) -> Void)?

    var body: some View {
        HStack(spacing: 4) {
            ForEach(1...maxRating, id: \.self) { star in
                Image(systemName: starImage(for: star))
                    .font(.system(size: starSize))
                    .foregroundStyle(star <= Int(rating.rounded()) ? Color.Brand.accent : Color(.systemGray4))
                    .onTapGesture {
                        if interactive {
                            onRatingChanged?(star)
                        }
                    }
            }
        }
    }

    private func starImage(for star: Int) -> String {
        let fullStars = Int(rating)
        let fraction = rating - Double(fullStars)

        if star <= fullStars {
            return "star.fill"
        } else if star == fullStars + 1 && fraction >= 0.5 {
            return "star.leadinghalf.filled"
        } else {
            return "star"
        }
    }
}
