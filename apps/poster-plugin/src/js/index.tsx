import { createRoot } from 'react-dom/client'

import App from './app'

const root = createRoot(
	document.querySelector('#app-container') as HTMLDivElement,
)

root.render(<App />)
