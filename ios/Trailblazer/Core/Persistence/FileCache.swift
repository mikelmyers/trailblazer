import Foundation

enum FileCache {
    private static var cacheDirectory: URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
            .appendingPathComponent("file_cache")
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    static func save<T: Encodable>(_ value: T, forKey key: String) {
        let url = cacheDirectory.appendingPathComponent("\(key).json")
        guard let data = try? JSONEncoder().encode(value) else { return }
        try? data.write(to: url, options: .atomic)
    }

    static func load<T: Decodable>(forKey key: String, type: T.Type) -> T? {
        let url = cacheDirectory.appendingPathComponent("\(key).json")
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? ResponseDecoder.shared.decode(T.self, from: data)
    }

    static func remove(forKey key: String) {
        let url = cacheDirectory.appendingPathComponent("\(key).json")
        try? FileManager.default.removeItem(at: url)
    }

    static func clearAll() {
        try? FileManager.default.removeItem(at: cacheDirectory)
    }
}
