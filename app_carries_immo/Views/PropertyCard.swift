import SwiftUI

struct PropertyCard: View {
    let property: PropertyListing

    var body: some View {
        HStack(spacing: 16) {
            Image(property.imageName)
                .resizable()
                .scaledToFill()
                .frame(width: 120, height: 120)
                .clipped()
                .cornerRadius(16)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(.white.opacity(0.2), lineWidth: 1)
                )
                .shadow(radius: 6, y: 4)

            VStack(alignment: .leading, spacing: 8) {
                Text(property.title)
                    .font(.headline)
                    .foregroundStyle(.primary)

                Label(property.location, systemImage: "mappin.and.ellipse")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                HStack(spacing: 12) {
                    Label("\(property.bedrooms)", systemImage: "bed.double.fill")
                    Label("\(property.bathrooms)", systemImage: "drop.fill")
                    Label("\(Int(property.area)) m²", systemImage: "ruler")
                }
                .font(.caption)
                .foregroundStyle(.secondary)

                Text(property.price)
                    .font(.headline)
                    .foregroundStyle(.accentColor)
            }

            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
    }
}

#Preview {
    PropertyCard(property: PropertyStore().nonFeaturedProperties.first!)
        .padding()
        .background(Color(.systemGroupedBackground))
}
