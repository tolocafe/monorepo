import {
	ForceResponsiveViewportFeature,
	HandleHTMLDimensionsFeature,
	makeWebshell,
} from '@formidable-webview/webshell'
import WebView from 'react-native-webview'

const WebContent = makeWebshell(
	WebView,
	new HandleHTMLDimensionsFeature(),
	new ForceResponsiveViewportFeature({ maxScale: 1 }),
)

export default WebContent
