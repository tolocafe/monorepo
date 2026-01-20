import { beanType } from './beanType'
import { eventType } from './eventType'
import {
	localeStringType,
	localeTextType,
	localeBlockContentType,
	localeSlugType,
} from './localeStringType'
import { locationType } from './locationType'
import { pageType } from './pageType'
import { postType } from './postType'
import { productType } from './productType'
import { promotionType } from './promotionType'

export const schemaTypes = [
	// Locale types
	localeStringType,
	localeTextType,
	localeBlockContentType,
	localeSlugType,
	// Document types
	beanType,
	eventType,
	locationType,
	pageType,
	postType,
	productType,
	promotionType,
]
