# TOLO Widget

Home screen widget that displays user visit counts (points), wallet balance, and name.

## Features

- **Points Display**: Shows the number of visits/transactions
- **Balance Display**: Shows current wallet balance in MXN
- **User Name**: Displays user's name
- **Widget Sizes**: Supports small and medium widget sizes
- **Deep Linking**: Taps open the app to the "More" tab

## Widget Sizes

### Small Widget

- TOLO branding
- Points (large display)
- Balance (smaller display)

### Medium Widget

- TOLO branding
- Points (left side, large)
- User name (right side, top)
- Balance (right side, bottom)

## Data Synchronization

The widget data is automatically synced from the main app using:

- **App Groups**: `group.cafe.tolo.app`
- **UserDefaults**: Shared storage between app and widget
- **Auto-refresh**: Updates every 15 minutes

### Synced Data

- `userPoints` (Integer): Number of transactions/visits
- `userBalance` (String): Formatted balance (e.g., "$50.00")
- `userName` (String): User's full name

## Development

The widget is built with:

- **SwiftUI**: Modern declarative UI
- **WidgetKit**: iOS widget framework
- **Timeline Provider**: Auto-refresh mechanism

### File Structure

```
targets/widget/
├── expo-target.config.js    # Target configuration
├── widget.swift              # Widget implementation
├── widget.entitlements       # App Groups entitlement
├── Info.plist               # Bundle configuration
└── README.md                # This file
```

## Testing

1. **Build & Run**: Select the `widget` scheme in Xcode
2. **Add to Home Screen**: Long press home screen → Add Widget → TOLO
3. **Test Data Sync**: Update user data in app and wait for widget refresh

## Troubleshooting

### Widget Not Updating

- Check App Groups entitlement is enabled in both targets
- Verify UserDefaults suite name matches: `group.cafe.tolo.app`
- Check that `useWidgetSync` hook is running in the app

### Widget Not Appearing

- Ensure deployment target is iOS 18.0+
- Verify widget scheme is properly configured
- Check code signing settings

## Color Scheme

The widget uses TOLO's brand color:

- **Background**: `#3D6039` (TOLO Green)
- **Text**: White with varying opacity for hierarchy
