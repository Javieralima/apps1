import SwiftUI

struct PropertyDetailView: View {
    let property: PropertyListing

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Image(property.imageName)
                    .resizable()
                    .scaledToFill()
                    .frame(height: 280)
                    .frame(maxWidth: .infinity)
                    .clipped()
                    .overlay(
                        LinearGradient(
                            gradient: Gradient(colors: [.black.opacity(0.6), .clear]),
                            startPoint: .bottom,
                            endPoint: .center
                        )
                    )
                    .overlay(alignment: .bottomLeading) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(property.title)
                                .font(.title.bold())
                            Text(property.location)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .foregroundStyle(.white)
                    }

                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 16) {
                        FactView(title: "Dormitorios", value: "\(property.bedrooms)")
                        FactView(title: "Baños", value: "\(property.bathrooms)")
                        FactView(title: "Superficie", value: "\(Int(property.area)) m²")
                    }

                    Text(property.description)
                        .font(.body)
                        .foregroundStyle(.primary)
                        .multilineTextAlignment(.leading)

                    HStack {
                        Text("Precio de venta")
                            .font(.headline)
                        Spacer()
                        Text(property.price)
                            .font(.title2.bold())
                            .foregroundStyle(.accentColor)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(Color(.secondarySystemBackground))
                    )
                }
                .padding(.horizontal)
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(property.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct FactView: View {
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 8) {
            Text(value)
                .font(.headline)
                .foregroundStyle(.accentColor)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
    }
}

#Preview {
    NavigationStack {
        PropertyDetailView(property: PropertyStore().featuredProperties.first!)
    }
}
