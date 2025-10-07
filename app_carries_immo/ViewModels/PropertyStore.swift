import Foundation

/// Represents a single real-estate property listing.
struct PropertyListing: Identifiable, Hashable {
    let id: UUID
    let title: String
    let location: String
    let price: String
    let bedrooms: Int
    let bathrooms: Int
    let area: Double
    let imageName: String
    let isFeatured: Bool
    let description: String

    init(
        id: UUID = UUID(),
        title: String,
        location: String,
        price: String,
        bedrooms: Int,
        bathrooms: Int,
        area: Double,
        imageName: String,
        isFeatured: Bool = false,
        description: String
    ) {
        self.id = id
        self.title = title
        self.location = location
        self.price = price
        self.bedrooms = bedrooms
        self.bathrooms = bathrooms
        self.area = area
        self.imageName = imageName
        self.isFeatured = isFeatured
        self.description = description
    }
}

/// Stores the property listings used across the app.
final class PropertyStore: ObservableObject {
    @Published private(set) var properties: [PropertyListing]

    init(properties: [PropertyListing] = PropertyStore.sampleData) {
        self.properties = properties
    }

    var featuredProperties: [PropertyListing] {
        properties.filter { $0.isFeatured }
    }

    var nonFeaturedProperties: [PropertyListing] {
        properties.filter { !$0.isFeatured }
    }
}

private extension PropertyStore {
    static let sampleData: [PropertyListing] = [
        PropertyListing(
            title: "Ático moderno con vistas al mar",
            location: "Alicante, España",
            price: "€345,000",
            bedrooms: 3,
            bathrooms: 2,
            area: 118,
            imageName: "penthouse",
            isFeatured: true,
            description: "Vivienda luminosa con amplia terraza y orientación sur."
        ),
        PropertyListing(
            title: "Casa adosada familiar",
            location: "Madrid, España",
            price: "€425,000",
            bedrooms: 4,
            bathrooms: 3,
            area: 160,
            imageName: "townhouse",
            isFeatured: true,
            description: "Urbanización privada con zonas verdes y piscina comunitaria."
        ),
        PropertyListing(
            title: "Estudio céntrico reformado",
            location: "Valencia, España",
            price: "€189,000",
            bedrooms: 1,
            bathrooms: 1,
            area: 54,
            imageName: "studio",
            description: "Ideal para inversores, muy cerca de transporte público."
        ),
        PropertyListing(
            title: "Chalet independiente con jardín",
            location: "Barcelona, España",
            price: "€695,000",
            bedrooms: 5,
            bathrooms: 4,
            area: 240,
            imageName: "villa",
            description: "Acabados premium, garaje doble y zona de barbacoa."
        )
    ]
}
