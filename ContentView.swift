import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Text("MyMeal App")
                .font(.largeTitle)
                .padding()
            
            Button(action: {
                if let url = URL(string: "https://suke358.github.io/MyMealApp----------/") {
                    UIApplication.shared.open(url)
                }
            }) {
                Text("食事")
                    .font(.title)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}