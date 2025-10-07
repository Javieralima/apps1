import SwiftUI

struct FeaturedCarousel: View {
    let properties: [PropertyListing]

    @State private var currentIndex = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Propiedades destacadas")
                .font(.title.bold())
                .padding(.horizontal)

            TabView(selection: $currentIndex) {
                ForEach(Array(properties.enumerated()), id: \.element.id) { index, property in
                    NavigationLink(value: property) {
                        ZStack(alignment: .bottomLeading) {
                            Image(property.imageName)
                                .resizable()
                                .scaledToFill()
                                .frame(height: 220)
                                .frame(maxWidth: .infinity)
                                .clipped()
                                .overlay(
                                    LinearGradient(
                                        gradient: Gradient(colors: [.black.opacity(0.6), .clear]),
                                        startPoint: .bottom,
                                        endPoint: .center
                                    )
                                )
                                .cornerRadius(18)
                                .shadow(radius: 12, y: 8)

                            VStack(alignment: .leading, spacing: 8) {
                                Label(property.location, systemImage: "mappin.and.ellipse")
                                    .font(.subheadline)
                                    .foregroundStyle(Color.white.opacity(0.85))

                                Text(property.title)
                                    .font(.title2.bold())
                                    .foregroundStyle(.white)

                                Text(property.price)
                                    .font(.headline)
                                    .foregroundStyle(.white.opacity(0.85))
                            }
                            .padding()
                        }
                        .padding(.horizontal)
                        .tag(index)
                    }
                    .buttonStyle(.plain)
                }
            }
            .frame(height: 260)
            .tabViewStyle(.page(indexDisplayMode: .automatic))
        }
    }
}

#Preview {
    FeaturedCarousel(properties: PropertyStore().featuredProperties)
        .environmentObject(PropertyStore())
}
