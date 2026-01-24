/**
 * Migration script to add the Investors page to Sanity CMS
 *
 * Run with: cd apps/studio && bunx sanity exec migrations/add-investors-page.ts --with-user-token
 */

/* eslint-disable no-console, sort-keys */

import { getCliClient } from 'sanity/cli'

const client = getCliClient()

const investorsPage = {
	_type: 'page',
	name: {
		de: 'Investoren',
		en: 'Investors',
		es: 'Inversionistas',
		fr: 'Investisseurs',
		ja: '投資家情報',
	},
	slug: {
		de: { _type: 'slug', current: 'investoren' },
		en: { _type: 'slug', current: 'investors' },
		es: { _type: 'slug', current: 'inversionistas' },
		fr: { _type: 'slug', current: 'investisseurs' },
		ja: { _type: 'slug', current: 'investors' },
	},
	excerpt: {
		de: 'Entdecken Sie Investitionsmöglichkeiten bei TOLO Coffee. Werden Sie Teil unserer wachsenden Kaffeekette in Mexiko.',
		en: 'Discover investment opportunities with TOLO Coffee. Join us in growing our specialty coffee chain across Mexico.',
		es: 'Descubre oportunidades de inversión con TOLO Coffee. Únete a nosotros en el crecimiento de nuestra cadena de café de especialidad en México.',
		fr: "Découvrez les opportunités d'investissement avec TOLO Coffee. Rejoignez-nous dans le développement de notre chaîne de café de spécialité au Mexique.",
		ja: 'TOLO Coffeeへの投資機会をご覧ください。メキシコ全土でスペシャルティコーヒーチェーンを成長させる私たちにご参加ください。',
	},
	body: {
		de: [
			{
				_key: 'intro',
				_type: 'block',
				children: [
					{
						_key: 'intro-text',
						_type: 'span',
						marks: [],
						text: 'TOLO ist eine wachsende Specialty-Coffee-Kette mit Sitz in Toluca, Mexiko. Wir sind leidenschaftlich daran interessiert, außergewöhnliche Kaffeeerlebnisse zu bieten und gleichzeitig ein nachhaltiges und skalierbares Unternehmen aufzubauen.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'why-invest-heading',
				_type: 'block',
				children: [
					{
						_key: 'why-invest-text',
						_type: 'span',
						marks: [],
						text: 'Warum in TOLO investieren',
					},
				],
				markDefs: [],
				style: 'h2',
			},
			{
				_key: 'market',
				_type: 'block',
				children: [
					{
						_key: 'market-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Wachsender Markt: ',
					},
					{
						_key: 'market-desc',
						_type: 'span',
						marks: [],
						text: 'Der mexikanische Specialty-Coffee-Markt wächst schnell mit steigender Nachfrage nach Qualitätskaffeeerlebnissen.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'quality',
				_type: 'block',
				children: [
					{
						_key: 'quality-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Qualitätsfokus: ',
					},
					{
						_key: 'quality-desc',
						_type: 'span',
						marks: [],
						text: 'Wir beziehen direkt von lokalen Bauern und rösten unsere eigenen Bohnen, um eine konstant außergewöhnliche Qualität zu gewährleisten.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'tech',
				_type: 'block',
				children: [
					{
						_key: 'tech-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Technologiegetrieben: ',
					},
					{
						_key: 'tech-desc',
						_type: 'span',
						marks: [],
						text: 'Unsere mobile App und unser Treueprogramm schaffen starke Kundenbindung und wertvolle Dateneinblicke.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'sustainable',
				_type: 'block',
				children: [
					{
						_key: 'sustainable-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Nachhaltiges Wachstum: ',
					},
					{
						_key: 'sustainable-desc',
						_type: 'span',
						marks: [],
						text: 'Wir setzen uns für nachhaltige Praktiken ein und unterstützen unsere lokalen Kaffeeanbaugemeinden.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'contact-heading',
				_type: 'block',
				children: [
					{
						_key: 'contact-text',
						_type: 'span',
						marks: [],
						text: 'Kontakt aufnehmen',
					},
				],
				markDefs: [],
				style: 'h2',
			},
			{
				_key: 'contact-info',
				_type: 'block',
				children: [
					{
						_key: 'contact-desc',
						_type: 'span',
						marks: [],
						text: 'Interessiert an Investitionsmöglichkeiten bei TOLO? Wir würden gerne von Ihnen hören. Kontaktieren Sie uns unter investors@tolo.cafe',
					},
				],
				markDefs: [],
				style: 'normal',
			},
		],
		en: [
			{
				_key: 'intro',
				_type: 'block',
				children: [
					{
						_key: 'intro-text',
						_type: 'span',
						marks: [],
						text: 'TOLO is a growing specialty coffee chain based in Toluca, Mexico. We are passionate about delivering exceptional coffee experiences while building a sustainable and scalable business.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'why-invest-heading',
				_type: 'block',
				children: [
					{
						_key: 'why-invest-text',
						_type: 'span',
						marks: [],
						text: 'Why Invest in TOLO',
					},
				],
				markDefs: [],
				style: 'h2',
			},
			{
				_key: 'market',
				_type: 'block',
				children: [
					{
						_key: 'market-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Growing Market: ',
					},
					{
						_key: 'market-desc',
						_type: 'span',
						marks: [],
						text: "Mexico's specialty coffee market is experiencing rapid growth with increasing demand for quality coffee experiences.",
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'quality',
				_type: 'block',
				children: [
					{
						_key: 'quality-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Quality Focus: ',
					},
					{
						_key: 'quality-desc',
						_type: 'span',
						marks: [],
						text: 'We source directly from local farmers and roast our own beans to ensure consistent, exceptional quality.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'tech',
				_type: 'block',
				children: [
					{
						_key: 'tech-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Technology Driven: ',
					},
					{
						_key: 'tech-desc',
						_type: 'span',
						marks: [],
						text: 'Our mobile app and loyalty program create strong customer engagement and valuable data insights.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'sustainable',
				_type: 'block',
				children: [
					{
						_key: 'sustainable-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Sustainable Growth: ',
					},
					{
						_key: 'sustainable-desc',
						_type: 'span',
						marks: [],
						text: 'We are committed to sustainable practices and supporting our local coffee-growing communities.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'contact-heading',
				_type: 'block',
				children: [
					{
						_key: 'contact-text',
						_type: 'span',
						marks: [],
						text: 'Get in Touch',
					},
				],
				markDefs: [],
				style: 'h2',
			},
			{
				_key: 'contact-info',
				_type: 'block',
				children: [
					{
						_key: 'contact-desc',
						_type: 'span',
						marks: [],
						text: 'Interested in learning more about investment opportunities with TOLO? We would love to hear from you. Contact us at investors@tolo.cafe',
					},
				],
				markDefs: [],
				style: 'normal',
			},
		],
		es: [
			{
				_key: 'intro',
				_type: 'block',
				children: [
					{
						_key: 'intro-text',
						_type: 'span',
						marks: [],
						text: 'TOLO es una cadena de café de especialidad en crecimiento con sede en Toluca, México. Nos apasiona ofrecer experiencias de café excepcionales mientras construimos un negocio sostenible y escalable.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'why-invest-heading',
				_type: 'block',
				children: [
					{
						_key: 'why-invest-text',
						_type: 'span',
						marks: [],
						text: 'Por qué invertir en TOLO',
					},
				],
				markDefs: [],
				style: 'h2',
			},
			{
				_key: 'market',
				_type: 'block',
				children: [
					{
						_key: 'market-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Mercado en crecimiento: ',
					},
					{
						_key: 'market-desc',
						_type: 'span',
						marks: [],
						text: 'El mercado de café de especialidad en México está experimentando un rápido crecimiento con una demanda cada vez mayor de experiencias de café de calidad.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'quality',
				_type: 'block',
				children: [
					{
						_key: 'quality-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Enfoque en la calidad: ',
					},
					{
						_key: 'quality-desc',
						_type: 'span',
						marks: [],
						text: 'Compramos directamente de agricultores locales y tostamos nuestros propios granos para asegurar una calidad excepcional y consistente.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'tech',
				_type: 'block',
				children: [
					{
						_key: 'tech-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Impulsado por tecnología: ',
					},
					{
						_key: 'tech-desc',
						_type: 'span',
						marks: [],
						text: 'Nuestra aplicación móvil y programa de lealtad crean un fuerte compromiso del cliente y valiosas perspectivas de datos.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'sustainable',
				_type: 'block',
				children: [
					{
						_key: 'sustainable-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Crecimiento sostenible: ',
					},
					{
						_key: 'sustainable-desc',
						_type: 'span',
						marks: [],
						text: 'Estamos comprometidos con prácticas sostenibles y con el apoyo a nuestras comunidades locales de cultivo de café.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'contact-heading',
				_type: 'block',
				children: [
					{
						_key: 'contact-text',
						_type: 'span',
						marks: [],
						text: 'Ponte en contacto',
					},
				],
				markDefs: [],
				style: 'h2',
			},
			{
				_key: 'contact-info',
				_type: 'block',
				children: [
					{
						_key: 'contact-desc',
						_type: 'span',
						marks: [],
						text: '¿Interesado en conocer más sobre oportunidades de inversión con TOLO? Nos encantaría saber de ti. Contáctanos en investors@tolo.cafe',
					},
				],
				markDefs: [],
				style: 'normal',
			},
		],
		fr: [
			{
				_key: 'intro',
				_type: 'block',
				children: [
					{
						_key: 'intro-text',
						_type: 'span',
						marks: [],
						text: "TOLO est une chaîne de café de spécialité en pleine croissance basée à Toluca, au Mexique. Nous sommes passionnés par l'offre d'expériences café exceptionnelles tout en construisant une entreprise durable et évolutive.",
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'why-invest-heading',
				_type: 'block',
				children: [
					{
						_key: 'why-invest-text',
						_type: 'span',
						marks: [],
						text: 'Pourquoi investir dans TOLO',
					},
				],
				markDefs: [],
				style: 'h2',
			},
			{
				_key: 'market',
				_type: 'block',
				children: [
					{
						_key: 'market-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Marché en croissance: ',
					},
					{
						_key: 'market-desc',
						_type: 'span',
						marks: [],
						text: "Le marché du café de spécialité au Mexique connaît une croissance rapide avec une demande croissante d'expériences café de qualité.",
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'quality',
				_type: 'block',
				children: [
					{
						_key: 'quality-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Focus qualité: ',
					},
					{
						_key: 'quality-desc',
						_type: 'span',
						marks: [],
						text: 'Nous nous approvisionnons directement auprès des agriculteurs locaux et torréfions nos propres grains pour assurer une qualité exceptionnelle et constante.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'tech',
				_type: 'block',
				children: [
					{
						_key: 'tech-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Axé sur la technologie: ',
					},
					{
						_key: 'tech-desc',
						_type: 'span',
						marks: [],
						text: 'Notre application mobile et notre programme de fidélité créent un fort engagement client et de précieuses informations données.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'sustainable',
				_type: 'block',
				children: [
					{
						_key: 'sustainable-text',
						_type: 'span',
						marks: ['strong'],
						text: 'Croissance durable: ',
					},
					{
						_key: 'sustainable-desc',
						_type: 'span',
						marks: [],
						text: 'Nous sommes engagés dans des pratiques durables et soutenons nos communautés locales de culture du café.',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'contact-heading',
				_type: 'block',
				children: [
					{
						_key: 'contact-text',
						_type: 'span',
						marks: [],
						text: 'Nous contacter',
					},
				],
				markDefs: [],
				style: 'h2',
			},
			{
				_key: 'contact-info',
				_type: 'block',
				children: [
					{
						_key: 'contact-desc',
						_type: 'span',
						marks: [],
						text: "Intéressé par les opportunités d'investissement avec TOLO? Nous serions ravis de vous entendre. Contactez-nous à investors@tolo.cafe",
					},
				],
				markDefs: [],
				style: 'normal',
			},
		],
		ja: [
			{
				_key: 'intro',
				_type: 'block',
				children: [
					{
						_key: 'intro-text',
						_type: 'span',
						marks: [],
						text: 'TOLOは、メキシコのトルーカを拠点とする成長中のスペシャルティコーヒーチェーンです。私たちは、持続可能でスケーラブルなビジネスを構築しながら、卓越したコーヒー体験を提供することに情熱を注いでいます。',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'why-invest-heading',
				_type: 'block',
				children: [
					{
						_key: 'why-invest-text',
						_type: 'span',
						marks: [],
						text: 'TOLOに投資する理由',
					},
				],
				markDefs: [],
				style: 'h2',
			},
			{
				_key: 'market',
				_type: 'block',
				children: [
					{
						_key: 'market-text',
						_type: 'span',
						marks: ['strong'],
						text: '成長市場：',
					},
					{
						_key: 'market-desc',
						_type: 'span',
						marks: [],
						text: 'メキシコのスペシャルティコーヒー市場は、高品質なコーヒー体験への需要の高まりとともに急成長しています。',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'quality',
				_type: 'block',
				children: [
					{
						_key: 'quality-text',
						_type: 'span',
						marks: ['strong'],
						text: '品質へのこだわり：',
					},
					{
						_key: 'quality-desc',
						_type: 'span',
						marks: [],
						text: '地元の農家から直接調達し、自社で焙煎することで、一貫した卓越した品質を確保しています。',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'tech',
				_type: 'block',
				children: [
					{
						_key: 'tech-text',
						_type: 'span',
						marks: ['strong'],
						text: 'テクノロジー主導：',
					},
					{
						_key: 'tech-desc',
						_type: 'span',
						marks: [],
						text: 'モバイルアプリとロイヤルティプログラムにより、強力な顧客エンゲージメントと価値あるデータインサイトを生み出しています。',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'sustainable',
				_type: 'block',
				children: [
					{
						_key: 'sustainable-text',
						_type: 'span',
						marks: ['strong'],
						text: '持続可能な成長：',
					},
					{
						_key: 'sustainable-desc',
						_type: 'span',
						marks: [],
						text: '持続可能な実践と地元のコーヒー栽培コミュニティの支援に取り組んでいます。',
					},
				],
				markDefs: [],
				style: 'normal',
			},
			{
				_key: 'contact-heading',
				_type: 'block',
				children: [
					{
						_key: 'contact-text',
						_type: 'span',
						marks: [],
						text: 'お問い合わせ',
					},
				],
				markDefs: [],
				style: 'h2',
			},
			{
				_key: 'contact-info',
				_type: 'block',
				children: [
					{
						_key: 'contact-desc',
						_type: 'span',
						marks: [],
						text: 'TOLOへの投資機会についてもっと知りたいですか？ぜひご連絡ください。investors@tolo.cafe',
					},
				],
				markDefs: [],
				style: 'normal',
			},
		],
	},
	showInNavigation: false,
}

async function runMigration() {
	console.log('Creating investors page...')

	try {
		const result = await client.create(investorsPage)
		console.log('Successfully created investors page with ID:', result._id)
	} catch (error) {
		if (error instanceof Error && error.message.includes('already exists')) {
			console.log('Investors page already exists, skipping creation')
		} else {
			console.error('Error creating page:', error)
			process.exit(1)
		}
	}
}

runMigration()
