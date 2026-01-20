import { Link } from 'react-router'

import type { Locale } from '@/lib/locale'
import { vars } from '@/styles/tokens.css'

import * as styles from './welcome.css'

const APP_STORE_URL =
	'https://apps.apple.com/app/tolo-buen-café/id6749597635' as const
const GOOGLE_PLAY_URL =
	'https://play.google.com/store/apps/details?id=cafe.tolo.app' as const

const ADDRESS =
	'Blvr. José María Pino Suárez 800, Cuauhtémoc, 50130 Toluca de Lerdo, Méx.' as const
const MAPS_QUERY = encodeURIComponent(ADDRESS)
const MAPS_URL =
	`https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}` as const
const MAPS_EMBED_URL =
	`https://www.google.com/maps?q=${MAPS_QUERY}&output=embed` as const

const TRANSLATIONS = {
	de: {
		aboutText:
			'Bei TOLO machen wir guten Kaffee — mehr nicht. Wir rösten jede Woche und servieren Espresso, Pour Overs, Matcha, Cold Brew, Chai, Kakao, Tee und Gebäck. Bohnen für zu Hause? Gibt\u2019s bei uns im Laden. Unsere Kaffees aus Mexiko sind Direkthandel mit Farmen, die wir kennen, und wir wechseln zwischen Kolumbien, Äthiopien und Panama.',
		aboutTitle: 'Hey, wir sind TOLO',
		brewingText:
			'Kräftig oder eher mild? Sag uns, was dir schmeckt, und wir finden was Passendes. Ganz entspannt.',
		brewingTitle: 'Dein Kaffee, wie du ihn magst',
		connectTitle: 'Verbinde dich mit TOLO',
		feature1Text:
			'Immer frischer Kaffee. Ganze Bohnen gibt\u2019s auch im Laden.',
		feature1Title: 'Jede Woche geröstet',
		feature2Text:
			'Unser Team ist SCA-zertifiziert und hilft dir gern, deinen Kaffee zu finden.',
		feature2Title: 'Kaffee-Menschen',
		feature3Text:
			'4,9★ mit 100+ Bewertungen (danke!). Finalisten bei lokalen Wettbewerben. Ein Ort zum Abhängen oder Arbeiten.',
		feature3Title: 'Community-Sache',
		featuresTitle: 'Noch ein bisschen mehr über uns',
		heroSubtitle:
			'Spezialitätenkaffee in Toluca — jede Woche frisch geröstet und mit Liebe zubereitet. Komm auf einen Espresso vorbei, bleib zum Arbeiten, oder mach\u2019s dir einfach gemütlich.',
		heroTitle: 'Guter Kaffee. Ganz einfach.',
		locationText:
			'Blvr. José María Pino Suárez 800, Cuauhtémoc, 50130 Toluca de Lerdo, Méx. Zum Quatschen, Arbeiten, oder einfach was Leckeres trinken. Schnelles WLAN, gemütliche Plätze, Hunde willkommen, Parkplätze da.',
		locationTitle: 'Komm vorbei',
		menuText:
			'Espresso, Pour Overs, Matcha, Cold Brew, Chai, Gebäck, Kakao und Tee. Bohnen auch.',
		menuTitle: 'Was gibt\u2019s',
		quickServiceText:
			'Wir sind fix. Oder bestell per App vor und hol einfach ab.',
		quickServiceTitle: 'Wenig Zeit?',
		roastingText:
			'Wir rösten jede Woche, also gibt\u2019s immer was Neues. Frag nach oder nimm eine Packung mit.',
		roastingTitle: 'Immer frisch',
		sustainabilityText:
			'Unsere Kaffees aus Mexiko kommen direkt von Farmen, die wir kennen. Dazu wechseln wir zwischen Kolumbien, Äthiopien, Panama und mehr.',
		sustainabilityTitle: 'Direkt von der Farm',
	},
	en: {
		aboutText:
			'At TOLO we make good coffee — that\u2019s it. We roast weekly and serve espresso, pour overs, matcha, cold brew, chai, cacao, tea, and pastries. Want beans to take home? We\u2019ve got bags in-store. Our Mexico coffees are direct trade with farms we know, and we rotate origins like Colombia, Ethiopia, and Panama.',
		aboutTitle: 'Hey, we\u2019re TOLO',
		brewingText:
			'Something bold or something lighter? Just tell us what you\u2019re into and we\u2019ll help you find it. No fuss.',
		brewingTitle: 'Your coffee, your way',
		connectTitle: 'Connect with TOLO',
		feature1Text:
			'Fresh coffee, always. We also sell bags of whole beans in-store.',
		feature1Title: 'Roasted every week',
		feature2Text:
			'Our team is SCA-certified and always happy to help you find your cup.',
		feature2Title: 'Coffee people',
		feature3Text:
			'4.9★ with 100+ reviews (thank you!). Local competition finalists. A space to hang or get stuff done.',
		feature3Title: 'A community thing',
		featuresTitle: 'A bit more about us',
		heroSubtitle:
			'Specialty coffee in Toluca — roasted weekly and made with care. Swing by for an espresso, stay to get some work done, or just hang out.',
		heroTitle: 'Good coffee. Simple as that.',
		locationText:
			'Blvr. José María Pino Suárez 800, Cuauhtémoc, 50130 Toluca de Lerdo, Méx. Stop by to hang, work, or just grab something good. We\u2019ve got fast Wi‑Fi, comfy seating, pets welcome, and parking.',
		locationTitle: 'Come say hi',
		menuText:
			'Espresso, pour overs, matcha, cold brew, chai, pastries, cacao, and tea. Whole beans too.',
		menuTitle: 'What\u2019s here',
		quickServiceText:
			'We\u2019ll get you moving. Or order ahead in the app and just pick up.',
		quickServiceTitle: 'In a hurry?',
		roastingText:
			'We roast weekly, so there\u2019s always something new. Ask what\u2019s fresh or grab a bag to go.',
		roastingTitle: 'Always fresh',
		sustainabilityText:
			'Our Mexico coffees come direct from farms we know. We also rotate origins from Colombia, Ethiopia, Panama, and more.',
		sustainabilityTitle: 'Straight from the farm',
	},
	es: {
		aboutText:
			'En TOLO hacemos buen café — eso es todo. Tostamos cada semana y preparamos espresso, pour overs, matcha, cold brew, chai, cacao, té y pan dulce. ¿Quieres llevarte café a casa? Tenemos bolsas de grano en tienda. Para nuestros cafés de México trabajamos directo con fincas que conocemos, y rotamos orígenes como Colombia, Etiopía y Panamá.',
		aboutTitle: 'Hola, somos TOLO',
		brewingText:
			'¿Algo intenso o algo más suave? Cuéntanos qué te late y te ayudamos a elegir. Sin complicaciones.',
		brewingTitle: 'Tu café, a tu gusto',
		connectTitle: 'Conecta con TOLO',
		feature1Text:
			'Café fresquito siempre. También vendemos bolsas de grano en tienda.',
		feature1Title: 'Tostado cada semana',
		feature2Text:
			'Nuestro equipo está certificado por la SCA y siempre listo para ayudarte a encontrar tu café.',
		feature2Title: 'Gente que sabe de café',
		feature3Text:
			'4.9★ con +100 reseñas (¡gracias!). Finalistas en competencias locales. Un espacio para convivir o trabajar.',
		feature3Title: 'Una comunidad chida',
		featuresTitle: 'Un poco más sobre nosotros',
		heroSubtitle:
			'Café de especialidad en Toluca, tostado cada semana y hecho con cariño. Pásate por un espresso, quédate a trabajar un rato, o simplemente ven a platicar.',
		heroTitle: 'Buen café. Así nomás.',
		locationText:
			'Blvr. José María Pino Suárez 800, Cuauhtémoc, 50130 Toluca de Lerdo, Méx. Ven a platicar, a trabajar, o nomás a tomar algo rico. Tenemos Wi‑Fi rápido, espacio para sentarte, mascotas bienvenidas y estacionamiento.',
		locationTitle: 'Pásate a vernos',
		menuText:
			'Espresso, pour overs, matcha, cold brew, chai, pan dulce, cacao y té. Café en grano también.',
		menuTitle: '¿Qué hay?',
		quickServiceText:
			'Te atendemos rápido. O pide por adelantado en la app y solo pasa a recoger.',
		quickServiceTitle: '¿Con prisa?',
		roastingText:
			'Tostamos cada semana, así que siempre hay algo recién salido. Pregunta qué hay nuevo o llévate una bolsa.',
		roastingTitle: 'Siempre fresquito',
		sustainabilityText:
			'Nuestros cafés de México vienen directo de fincas que conocemos. También rotamos orígenes de Colombia, Etiopía, Panamá y más.',
		sustainabilityTitle: 'Directo de la finca',
	},
	fr: {
		aboutText:
			'Chez TOLO, on fait du bon café — point. On torréfie chaque semaine et on sert espresso, pour overs, matcha, cold brew, chai, cacao, thé et pâtisseries. Tu veux du café pour chez toi ? On a des sachets en boutique. Nos cafés du Mexique viennent en direct de fermes qu\u2019on connaît, et on fait tourner des origines comme la Colombie, l\u2019Éthiopie et le Panama.',
		aboutTitle: 'Salut, on est TOLO',
		brewingText:
			'Plutôt corsé ou plus léger ? Dis-nous ce que tu aimes et on trouve ensemble. Tranquille.',
		brewingTitle: 'Ton café, comme tu l\u2019aimes',
		connectTitle: 'Connecte-toi avec TOLO',
		feature1Text:
			'Café frais, toujours. On vend aussi des sachets de grains en boutique.',
		feature1Title: 'Torréfié chaque semaine',
		feature2Text:
			'Notre équipe est certifiée SCA et toujours là pour t\u2019aider à trouver ton café.',
		feature2Title: 'Des gens du café',
		feature3Text:
			'4,9★ avec 100+ avis (merci !). Finalistes de compétitions locales. Un endroit pour traîner ou bosser.',
		feature3Title: 'Un truc de communauté',
		featuresTitle: 'Un peu plus sur nous',
		heroSubtitle:
			'Café de spécialité à Toluca — torréfié chaque semaine et préparé avec soin. Passe pour un espresso, reste bosser un peu, ou viens juste traîner.',
		heroTitle: 'Du bon café. C\u2019est tout.',
		locationText:
			'Blvr. José María Pino Suárez 800, Cuauhtémoc, 50130 Toluca de Lerdo, Méx. Pour discuter, bosser, ou juste boire un truc sympa. Wi‑Fi rapide, places assises, animaux bienvenus, parking dispo.',
		locationTitle: 'Passe nous voir',
		menuText:
			'Espresso, pour overs, matcha, cold brew, chai, pâtisseries, cacao et thé. Grains aussi.',
		menuTitle: 'Qu\u2019est-ce qu\u2019il y a',
		quickServiceText:
			'On te sert vite. Ou commande à l\u2019avance via l\u2019app et passe récupérer.',
		quickServiceTitle: 'Pressé·e ?',
		roastingText:
			'On torréfie chaque semaine, donc y\u2019a toujours du nouveau. Demande ce qu\u2019il y a ou repars avec un sachet.',
		roastingTitle: 'Toujours frais',
		sustainabilityText:
			'Nos cafés du Mexique viennent en direct de fermes qu\u2019on connaît. On fait aussi tourner des origines de Colombie, d\u2019Éthiopie, du Panama et plus.',
		sustainabilityTitle: 'Direct de la ferme',
	},
	ja: {
		aboutText:
			'TOLOはおいしいコーヒーをつくるお店です。それだけ。毎週焙煎し、エスプレッソ、プアオーバー、抹茶、コールドブリュー、チャイ、カカオ、紅茶、焼き菓子をご用意。豆を持ち帰りたい方には店頭で販売しています。メキシコのコーヒーは知っている農園からダイレクトトレードで。コロンビア、エチオピア、パナマなども入れ替わりで。',
		aboutTitle: 'こんにちは、TOLOです',
		brewingText:
			'濃いめ？すっきりめ？好みを教えてください。ぴったりの一杯を一緒に探しましょう。',
		brewingTitle: 'あなた好みの一杯',
		connectTitle: 'TOLOとつながる',
		feature1Text: 'いつも新鮮なコーヒー。店頭で豆も販売しています。',
		feature1Title: '毎週焙煎',
		feature2Text: 'SCA認定チームが、あなたの一杯探しをお手伝い。',
		feature2Title: 'コーヒー好きなスタッフ',
		feature3Text:
			'4.9★、100件以上のレビュー（ありがとう！）。地元大会のファイナリスト。集まる場所、作業する場所。',
		feature3Title: 'みんなの場所',
		featuresTitle: 'もうちょっとだけ',
		heroSubtitle:
			'トルーカのスペシャルティコーヒー。毎週焙煎、丁寧にお作りします。エスプレッソをさっと、作業しながらゆっくり、ふらっと立ち寄るだけでも。',
		heroTitle: 'おいしいコーヒー、それだけ。',
		locationText:
			'Blvr. José María Pino Suárez 800, Cuauhtémoc, 50130 Toluca de Lerdo, Méx. おしゃべり、作業、おいしいものを飲みに。高速Wi‑Fi、座席あり、ペットOK、駐車場あり。',
		locationTitle: '遊びに来てね',
		menuText:
			'エスプレッソ、プアオーバー、抹茶、コールドブリュー、チャイ、焼き菓子、カカオ、紅茶。豆も。',
		menuTitle: '何がある？',
		quickServiceText:
			'スムーズにお出しします。アプリで事前注文して受け取りも。',
		quickServiceTitle: '急いでる？',
		roastingText:
			'毎週焙煎しているので、いつも新しいものがあります。何が新しいか聞いてみて、または豆をお持ち帰りで。',
		roastingTitle: 'いつも新鮮',
		sustainabilityText:
			'メキシコのコーヒーは知っている農園からダイレクトトレード。コロンビア、エチオピア、パナマなども入れ替わりで。',
		sustainabilityTitle: '農園から直接',
	},
} as const

const UI_TRANSLATIONS = {
	de: {
		appBullets: ['Vorbestellen', 'Im Laden abholen', 'iOS & Android'],
		appBulletsTitle: 'Mit der App',
		appStore: 'App Store',
		appText:
			'Bestell deinen Lieblingskaffee im Voraus und hol ihn ab, sobald du ankommst — kein Warten. Speichere deine Favoriten, bestell frühere Drinks erneut und erhalte exklusive Angebote. Die App ist kostenlos und verfügbar für iOS und Android.',
		appTitle: 'Unsere App',
		directionsCta: 'In Google Maps öffnen',
		googlePlay: 'Google Play',
		heroCtas: {
			app: 'App holen',
			beans: 'Bohnen',
			directions: 'Route',
		},
		menuItems: [
			'Espresso-Getränke',
			'Pour Overs',
			'Matcha',
			'Cold Brew',
			'Chai',
			'Gebäck',
			'Kakao',
			'Tee',
		],
		menuNote: 'Ganze Bohnen im Laden erhältlich.',
		quickCards: {
			app: {
				cta: 'App herunterladen',
				text: 'Vorbestellen und entspannt abholen.',
				title: 'Mit der App bestellen',
			},
			beans: {
				cta: 'Bohnen ansehen',
				text: 'Unsere Kaffees entdecken und im Laden eine Packung mitnehmen.',
				title: 'Ganze Bohnen',
			},
			visit: {
				cta: 'Zur Adresse',
				text: 'Treffpunkt + Arbeitsplatz: schnelles WLAN und hundefreundlich.',
				title: 'Besuchen',
			},
		},
		trustItems: [
			{ label: '100+ Bewertungen', value: '4.9★' },
			{ label: 'Jede Woche geröstet', value: 'Wöchentlich' },
			{ label: 'Vorbestellen', value: 'App' },
		],
		visitAmenities: [
			'Schnelles WLAN',
			'Sitzplätze + zum Arbeiten',
			'Hundefreundlich',
			'Parkplätze verfügbar',
			'Vorbestellung per App',
		],
		visitAmenitiesTitle: 'Was dich erwartet',
		visitDescription:
			'Schneller Service, entspannte Atmosphäre und ein perfekter Ort zum Arbeiten.',
		visitTitle: 'Besuche uns in Toluca',
	},
	en: {
		appBullets: [
			'Order ahead',
			'Pick up in-store',
			'Available on iOS and Android',
		],
		appBulletsTitle: 'With the app',
		appStore: 'App Store',
		appText:
			'Order your favorite coffee ahead of time and pick it up when you arrive—no waiting. Save your favorites, reorder past drinks, and get exclusive offers. The app is free and available on iOS and Android.',
		appTitle: 'Our app',
		directionsCta: 'Open in Google Maps',
		googlePlay: 'Google Play',
		heroCtas: {
			app: 'Get the app',
			beans: 'Whole beans',
			directions: 'Get directions',
		},
		menuItems: [
			'Espresso drinks',
			'Pour overs',
			'Matcha',
			'Cold brew',
			'Chai',
			'Pastries',
			'Cacao',
			'Tea',
		],
		menuNote: 'Whole bean coffee available in-store, too.',
		quickCards: {
			app: {
				cta: 'Download the app',
				text: 'Order ahead and pick up—no waiting around.',
				title: 'Order with the app',
			},
			beans: {
				cta: 'See beans',
				text: 'Browse our coffees and grab a bag in-store.',
				title: 'Whole bean coffee',
			},
			visit: {
				cta: 'See location',
				text: 'Community hang + work-friendly: fast Wi‑Fi, pet-friendly, and good vibes.',
				title: 'Visit',
			},
		},
		trustItems: [
			{ label: '100+ reviews', value: '4.9★' },
			{ label: 'Roasted every week', value: 'Weekly' },
			{ label: 'Order ahead', value: 'App' },
		],
		visitAmenities: [
			'High-speed Wi‑Fi',
			'Seating + work-friendly space',
			'Pet-friendly',
			'Parking available',
			'Order ahead in the app',
		],
		visitAmenitiesTitle: 'What you’ll find',
		visitDescription:
			'Fast service, welcoming vibes, and a perfect place to work.',
		visitTitle: 'Visit us in Toluca',
	},
	es: {
		appBullets: ['Ordena por adelantado', 'Recoge en tienda', 'iOS y Android'],
		appBulletsTitle: 'Con la app',
		appStore: 'App Store',
		appText:
			'Pide tu café favorito por adelantado y recógelo cuando llegues, sin esperar. Guarda tus favoritos, repite pedidos anteriores y recibe ofertas exclusivas. La app es gratis y está disponible para iOS y Android.',
		appTitle: 'Nuestra app',
		directionsCta: 'Abrir en Google Maps',
		googlePlay: 'Google Play',
		heroCtas: {
			app: 'Descargar app',
			beans: 'Café en grano',
			directions: 'Cómo llegar',
		},
		menuItems: [
			'Bebidas espresso',
			'Pour overs',
			'Matcha',
			'Cold brew',
			'Chai',
			'Pan dulce',
			'Cacao',
			'Té',
		],
		menuNote: 'Y si quieres llevarte café: café en grano en tienda.',
		quickCards: {
			app: {
				cta: 'Descargar app',
				text: 'Pide por adelantado y pasa a recoger, sin filas.',
				title: 'Ordena con la app',
			},
			beans: {
				cta: 'Ver granos',
				text: 'Explora nuestros cafés en grano y llévate una bolsa (en tienda).',
				title: 'Café en grano',
			},
			visit: {
				cta: 'Ver ubicación',
				text: 'Un lugar para convivir o trabajar: Wi‑Fi rápido, pet‑friendly y buen ambiente.',
				title: 'Visítanos',
			},
		},
		trustItems: [
			{ label: '100+ reseñas', value: '4.9★' },
			{ label: 'Tostado cada semana', value: 'Semanal' },
			{ label: 'Pide por adelantado', value: 'App' },
		],
		visitAmenities: [
			'Wi‑Fi de alta velocidad',
			'Asientos y espacio para trabajar',
			'Pet‑friendly',
			'Estacionamiento disponible',
			'Order ahead en la app',
		],
		visitAmenitiesTitle: 'Lo que encontrarás',
		visitDescription:
			'Un lugar para convivir, trabajar o pasar por algo rico — con servicio rápido y buena vibra.',
		visitTitle: 'Visítanos en Toluca',
	},
	fr: {
		appBullets: [
			'Commande à l’avance',
			'Retrait en boutique',
			'iOS et Android',
		],
		appBulletsTitle: 'Avec l’app',
		appStore: 'App Store',
		appText:
			'Commande ton café préféré à l\u2019avance et récupère-le en arrivant — pas d\u2019attente. Sauvegarde tes favoris, recommande tes boissons et reçois des offres exclusives. L\u2019app est gratuite et disponible sur iOS et Android.',
		appTitle: 'Notre app',
		directionsCta: 'Ouvrir dans Google Maps',
		googlePlay: 'Google Play',
		heroCtas: {
			app: 'Télécharger l’app',
			beans: 'Café en grains',
			directions: 'Itinéraire',
		},
		menuItems: [
			'Boissons espresso',
			'Pour overs',
			'Matcha',
			'Cold brew',
			'Chai',
			'Pâtisseries',
			'Cacao',
			'Thé',
		],
		menuNote: 'Café en grains disponible en boutique.',
		quickCards: {
			app: {
				cta: 'Télécharger l’app',
				text: 'Commande à l’avance et retrait facile.',
				title: 'Commander via l’app',
			},
			beans: {
				cta: 'Voir les grains',
				text: 'Découvrir nos cafés et repartir avec un sachet en boutique.',
				title: 'Café en grains',
			},
			visit: {
				cta: 'Voir la localisation',
				text: 'Lieu convivial + parfait pour travailler : Wi‑Fi rapide, animaux bienvenus.',
				title: 'Nous trouver',
			},
		},
		trustItems: [
			{ label: '100+ avis', value: '4.9★' },
			{ label: 'Torréfié chaque semaine', value: 'Hebdo' },
			{ label: 'Commande à l\u2019avance', value: 'App' },
		],
		visitAmenities: [
			'Wi‑Fi haut débit',
			'Assises + espace pour travailler',
			'Animaux bienvenus',
			'Parking disponible',
			'Commande à l’avance via l’app',
		],
		visitAmenitiesTitle: 'Ce que tu trouveras',
		visitDescription:
			'Service rapide, ambiance chaleureuse, et un endroit idéal pour travailler.',
		visitTitle: 'Retrouve‑nous à Toluca',
	},
	ja: {
		appBullets: ['事前注文', '店頭で受け取り', 'iOS / Android 対応'],
		appBulletsTitle: 'アプリでできること',
		appStore: 'App Store',
		appText:
			'お気に入りのコーヒーを事前注文して、到着時にすぐ受け取り。お気に入りを保存したり、過去の注文を再オーダーしたり、限定オファーを受け取ったり。無料アプリ、iOS / Android 対応。',
		appTitle: 'TOLOアプリ',
		directionsCta: 'Google Mapsで開く',
		googlePlay: 'Google Play',
		heroCtas: {
			app: 'アプリを入手',
			beans: '豆',
			directions: '行き方',
		},
		menuItems: [
			'エスプレッソ',
			'プアオーバー',
			'抹茶',
			'コールドブリュー',
			'チャイ',
			'焼き菓子',
			'カカオ',
			'紅茶',
		],
		menuNote: 'コーヒー豆は店頭で販売しています。',
		quickCards: {
			app: {
				cta: 'アプリを入手',
				text: '事前注文してスムーズに受け取り。',
				title: 'アプリで注文',
			},
			beans: {
				cta: '豆を見る',
				text: '豆をチェックして、店頭で持ち帰りもできます。',
				title: 'コーヒー豆',
			},
			visit: {
				cta: '場所を見る',
				text: '集まれる場所＋作業にも。高速Wi‑Fi、ペットOK。',
				title: '店舗情報',
			},
		},
		trustItems: [
			{ label: 'レビュー100件+', value: '4.9★' },
			{ label: '毎週焙煎', value: '毎週' },
			{ label: '事前注文', value: 'App' },
		],
		visitAmenities: [
			'高速Wi‑Fi',
			'席あり／作業しやすい',
			'ペットOK',
			'駐車スペースあり',
			'アプリで事前注文',
		],
		visitAmenitiesTitle: 'ポイント',
		visitDescription: '早いサービス、居心地のよさ、作業にもぴったり。',
		visitTitle: 'トルーカでお待ちしています',
	},
} as const

interface WelcomeProps {
	message: string
	locale: Locale
}

export function Welcome({ locale }: WelcomeProps) {
	const t = TRANSLATIONS[locale] || TRANSLATIONS.es
	const ui = UI_TRANSLATIONS[locale] || UI_TRANSLATIONS.es
	const basePath = `/${locale}`
	const beansPath = locale === 'es' ? 'granos' : 'beans'
	const beansTo = `/${locale}/${beansPath}`
	const appTo = `${basePath}#app`
	const visitTo = `${basePath}#visit`

	const highlights = [
		{ text: t.brewingText, title: t.brewingTitle },
		{ text: t.quickServiceText, title: t.quickServiceTitle },
		{ text: t.roastingText, title: t.roastingTitle },
		{ text: t.sustainabilityText, title: t.sustainabilityTitle },
	] as const

	return (
		<main className={styles.main}>
			{/* Hero Section */}
			<section className={styles.hero}>
				<div className={styles.heroVideo}>
					<iframe
						className={styles.heroVideoIframe}
						src="https://customer-jwnlj2lnbxh5it88.cloudflarestream.com/80c3111543efaccaf6f1d2d3120f4a77/iframe?muted=true&loop=true&autoplay=true&poster=https%3A%2F%2Fcustomer-jwnlj2lnbxh5it88.cloudflarestream.com%2F80c3111543efaccaf6f1d2d3120f4a77%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600&controls=false"
						loading="lazy"
						sandbox="allow-scripts"
						allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
						title="TOLO Coffee Hero Video"
					/>
				</div>
				<div className={styles.heroOverlay} />
				<div className={styles.heroContent}>
					<h1 className={styles.heroTitle}>{t.heroTitle}</h1>
					<p className={styles.heroSubtitle}>{t.heroSubtitle}</p>

					<div className={styles.heroActions}>
						<Link to={appTo} className={styles.heroPrimaryButton}>
							{ui.heroCtas.app}
						</Link>
						<a
							href={MAPS_URL}
							target="_blank"
							rel="noreferrer"
							className={styles.heroSecondaryButton}
						>
							{ui.heroCtas.directions}
						</a>
					</div>
				</div>
			</section>

			{/* Quick Links */}
			<section className={styles.quickLinksSection}>
				<div className={styles.container}>
					<dl className={styles.trustBar}>
						{ui.trustItems.map((item) => (
							<div key={item.label} className={styles.trustItem}>
								<dt className={styles.trustValue}>{item.value}</dt>
								<dd className={styles.trustLabel}>{item.label}</dd>
							</div>
						))}
					</dl>

					<div className={styles.quickLinksGrid}>
						<Link to={beansTo} className={styles.quickCard}>
							<div className={styles.quickCardImage} />
							<div className={styles.quickCardBody}>
								<h3 className={styles.quickCardTitle}>
									{ui.quickCards.beans.title}
								</h3>
								<p className={styles.quickCardText}>
									{ui.quickCards.beans.text}
								</p>
								<span className={styles.quickCardCta}>
									{ui.quickCards.beans.cta} →
								</span>
							</div>
						</Link>
						<Link to={visitTo} className={styles.quickCard}>
							<div className={styles.quickCardImage} />
							<div className={styles.quickCardBody}>
								<h3 className={styles.quickCardTitle}>
									{ui.quickCards.visit.title}
								</h3>
								<p className={styles.quickCardText}>
									{ui.quickCards.visit.text}
								</p>
								<span className={styles.quickCardCta}>
									{ui.quickCards.visit.cta} →
								</span>
							</div>
						</Link>
						<Link to={appTo} className={styles.quickCard}>
							<div className={styles.quickCardImage} />
							<div className={styles.quickCardBody}>
								<h3 className={styles.quickCardTitle}>
									{ui.quickCards.app.title}
								</h3>
								<p className={styles.quickCardText}>{ui.quickCards.app.text}</p>
								<span className={styles.quickCardCta}>
									{ui.quickCards.app.cta} →
								</span>
							</div>
						</Link>
					</div>
				</div>
			</section>

			{/* About Section */}
			<section id="about" className={styles.sectionAnchor}>
				<div className={styles.container}>
					<div className={styles.aboutGrid}>
						<div className={styles.aboutTextBlock}>
							<h2 className={styles.sectionTitle}>{t.aboutTitle}</h2>
							<p className={styles.sectionText}>{t.aboutText}</p>
						</div>
						<div className={styles.aboutImageBlock}>
							<div className={styles.aboutImage} />
						</div>
					</div>

					<div className={styles.highlightsGrid}>
						{highlights.map((item) => (
							<div key={item.title} className={styles.highlightCard}>
								<h3 className={styles.highlightTitle}>{item.title}</h3>
								<p className={styles.highlightText}>{item.text}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Menu Section */}
			<section id="menu" className={styles.sectionAnchor}>
				<div className={styles.sectionContent}>
					<h2 className={styles.sectionTitle}>{t.menuTitle}</h2>
					<div className={styles.chipGrid}>
						{ui.menuItems.map((item) => (
							<span key={item} className={styles.chip}>
								{item}
							</span>
						))}
					</div>
					<p className={styles.sectionText}>{ui.menuNote}</p>
				</div>
			</section>

			{/* App Section */}
			<section id="app" className={styles.sectionAnchor}>
				<div className={styles.container}>
					<h2 className={styles.sectionTitle}>{ui.appTitle}</h2>
					<div className={styles.splitSection}>
						<div>
							<p className={styles.appText}>{ui.appText}</p>
							<div className={styles.storeButtons}>
								<a
									href={APP_STORE_URL}
									target="_blank"
									rel="noreferrer"
									className={styles.storeButtonPrimary}
								>
									{ui.appStore}
								</a>
								<a
									href={GOOGLE_PLAY_URL}
									target="_blank"
									rel="noreferrer"
									className={styles.storeButtonSecondary}
								>
									{ui.googlePlay}
								</a>
							</div>
						</div>
						<div className={styles.appImage} />
					</div>
				</div>
			</section>

			{/* Visit Section */}
			<section id="visit" className={styles.sectionAnchor}>
				<div className={styles.container}>
					<div className={styles.visitImage} />
					<div className={styles.visitGrid}>
						<div className={styles.visitCard}>
							<h2 className={styles.sectionTitle}>{ui.visitTitle}</h2>
							<p className={styles.sectionText}>{ui.visitDescription}</p>

							<div className={styles.infoCard}>
								<h3 className={styles.subTitle}>{ui.visitAmenitiesTitle}</h3>
								<ul className={styles.bullets}>
									{ui.visitAmenities.map((amenity) => (
										<li key={amenity} className={styles.bullet}>
											{amenity}
										</li>
									))}
								</ul>
								<a
									href={MAPS_URL}
									target="_blank"
									rel="noreferrer"
									className={styles.directionsLink}
									style={{ marginTop: vars.space[4] }}
								>
									{ui.directionsCta}
								</a>
							</div>
						</div>

						<div className={styles.mapWrapper}>
							<iframe
								title="TOLO Coffee map"
								src={MAPS_EMBED_URL}
								className={styles.map}
								loading="lazy"
								sandbox="allow-scripts"
								referrerPolicy="no-referrer-when-downgrade"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className={styles.featuresSection}>
				<h2 className={styles.featuresSectionTitle}>{t.featuresTitle}</h2>
				<div className={styles.featuresGrid}>
					<div className={styles.featureCard}>
						<div className={styles.featureIcon}>
							<CoffeeIcon />
						</div>
						<h3 className={styles.featureTitle}>{t.feature1Title}</h3>
						<p className={styles.featureText}>{t.feature1Text}</p>
					</div>
					<div className={styles.featureCard}>
						<div className={styles.featureIcon}>
							<PrecisionIcon />
						</div>
						<h3 className={styles.featureTitle}>{t.feature2Title}</h3>
						<p className={styles.featureText}>{t.feature2Text}</p>
					</div>
					<div className={styles.featureCard}>
						<div className={styles.featureIcon}>
							<HeartIcon />
						</div>
						<h3 className={styles.featureTitle}>{t.feature3Title}</h3>
						<p className={styles.featureText}>{t.feature3Text}</p>
					</div>
				</div>
			</section>
		</main>
	)
}

function CoffeeIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M17 8h1a4 4 0 1 1 0 8h-1" />
			<path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
			<line x1="6" x2="6" y1="2" y2="4" />
			<line x1="10" x2="10" y1="2" y2="4" />
			<line x1="14" x2="14" y1="2" y2="4" />
		</svg>
	)
}

function PrecisionIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<circle cx="12" cy="12" r="6" />
			<circle cx="12" cy="12" r="2" />
		</svg>
	)
}

function HeartIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
		</svg>
	)
}
