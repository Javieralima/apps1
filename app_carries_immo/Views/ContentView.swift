import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var propertyStore: PropertyStore

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    if !propertyStore.featuredProperties.isEmpty {
                        FeaturedCarousel(properties: propertyStore.featuredProperties)
                    }

                    Text("Propiedades disponibles")
                        .font(.title2.bold())
                        .padding(.horizontal)

                    LazyVStack(spacing: 16) {
                        ForEach(propertyStore.nonFeaturedProperties) { property in
                            NavigationLink(value: property) {
                                PropertyCard(property: property)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 24)
            }
            .navigationTitle("App Carries Immo")
            .navigationDestination(for: PropertyListing.self) { property in
                PropertyDetailView(property: property)
            }
            .background(Color(.systemGroupedBackground))
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(PropertyStore())
}
