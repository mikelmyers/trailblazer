import Foundation

extension Int {
    /// Formats cents as a dollar string (e.g., 1500 → "$15.00")
    var formattedCurrency: String {
        let dollars = Double(self) / 100.0
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: dollars)) ?? "$\(String(format: "%.2f", dollars))"
    }

    /// Shorter currency format (e.g., 1500 → "$15")
    var shortCurrency: String {
        let dollars = Double(self) / 100.0
        if dollars.truncatingRemainder(dividingBy: 1) == 0 {
            return "$\(Int(dollars))"
        }
        return "$\(String(format: "%.2f", dollars))"
    }
}

extension Double {
    var formattedCurrency: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: self)) ?? "$\(String(format: "%.2f", self))"
    }
}
