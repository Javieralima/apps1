import SwiftUI

@main
struct AppCarriesImmoApp: App {
    @StateObject private var propertyStore = PropertyStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(propertyStore)
        }
    }
}
