import Foundation

struct PaginatedResponse<T: Decodable>: Decodable {
    let data: [T]
    let pagination: PaginationMeta

    struct PaginationMeta: Decodable {
        let page: Int
        let limit: Int
        let total: Int
        let totalPages: Int
    }
}
