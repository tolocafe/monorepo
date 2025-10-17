import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), points: 0, balance: "$0.00", name: "Usuario")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), points: 12, balance: "$50.00", name: "Usuario")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // Fetch user data from UserDefaults shared with the main app
        let sharedDefaults = UserDefaults(suiteName: "group.cafe.tolo.app")

        let points = sharedDefaults?.integer(forKey: "userPoints") ?? 0
        let balance = sharedDefaults?.string(forKey: "userBalance") ?? "$0.00"
        let name = sharedDefaults?.string(forKey: "userName") ?? "Usuario"

        let entry = SimpleEntry(date: Date(), points: points, balance: balance, name: name)

        // Update every 15 minutes
        let nextUpdateDate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdateDate))

        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let points: Int
    let balance: String
    let name: String
}

struct widgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

struct SmallWidgetView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("TOLO")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white.opacity(0.9))

            Spacer()

            VStack(alignment: .leading, spacing: 4) {
                Text("Puntos")
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.7))
                Text("\(entry.points)")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)
            }

            Spacer()

            VStack(alignment: .leading, spacing: 2) {
                Text("Saldo")
                    .font(.system(size: 10))
                    .foregroundColor(.white.opacity(0.7))
                Text(entry.balance)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
            }
        }
        .padding(4)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(for: .widget) {
            Color(red: 0.239, green: 0.376, blue: 0.224) // #3D6039
        }
        .widgetURL(URL(string: "tolo://more"))
    }
}

struct MediumWidgetView: View {
    var entry: Provider.Entry

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("TOLO")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white.opacity(0.9))

                Spacer()

                VStack(alignment: .leading, spacing: 4) {
                    Text("Puntos")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.7))
                    Text("\(entry.points)")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.white)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 16) {
                VStack(alignment: .trailing, spacing: 4) {
                    Text(entry.name)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("Saldo")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.7))
                    Text(entry.balance)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.white)
                }
            }
        }
        .padding(8)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .containerBackground(for: .widget) {
            Color(red: 0.239, green: 0.376, blue: 0.224) // #3D6039
        }
        .widgetURL(URL(string: "tolo://more"))
    }
}

@main
struct widget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            widgetEntryView(entry: entry)
        }
        .configurationDisplayName("TOLO")
        .description("Ve tus puntos y saldo de TOLO")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct widget_Previews: PreviewProvider {
    static var previews: some View {
        widgetEntryView(entry: SimpleEntry(date: Date(), points: 15, balance: "$125.00", name: "César"))
            .previewContext(WidgetPreviewContext(family: .systemSmall))

        widgetEntryView(entry: SimpleEntry(date: Date(), points: 15, balance: "$125.00", name: "César"))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}

