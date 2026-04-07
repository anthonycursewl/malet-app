import WidgetKit
import SwiftUI
import Intents

struct RateEntry: TimelineEntry {
    let date: Date
    let rate: String
    let change: String
    let isPositive: Bool
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> RateEntry {
        RateEntry(date: Date(), rate: "36.42", change: "+0.25%", isPositive: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (RateEntry) -> ()) {
        let entry = getEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = getEntry()
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
    
    // Read from UserDefaults (App Group)
    private func getEntry() -> RateEntry {
        let defaults = UserDefaults(suiteName: "group.com.cursewlx.maletapp.widgets")
        let rate = defaults?.string(forKey: "usd_rate") ?? "36.42"
        let change = defaults?.string(forKey: "usd_change") ?? "+0.00%"
        let isPositive = defaults?.bool(forKey: "usd_is_positive") ?? true
        
        return RateEntry(date: Date(), rate: rate, change: change, isPositive: isPositive)
    }
}

struct RateWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("USD / VED")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
                Spacer()
                Image(systemName: "arrow.left.arrow.right")
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
            }
            
            Text("Bs " + entry.rate)
                .font(.system(size: 24, weight: .bold))
                .minimumScaleFactor(0.5)
            
            HStack {
                Circle()
                    .fill(Color.green)
                    .frame(width: 5, height: 5)
                Text("Cargado")
                    .font(.system(size: 9))
                    .foregroundColor(.secondary)
                Spacer()
                Text(entry.change)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(entry.isPositive ? .green : .red)
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            Color(.systemBackground)
        }
    }
}

@main
struct RateWidget: Widget {
    let kind: String = "RateWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            RateWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Malet | Tasa de Cambio")
        .description("Mira el precio del dólar al instante.")
        .supportedFamilies([.systemSmall])
    }
}
