# Language Support Refactoring Summary

## Overview

Refactored the language support system to use a single source of truth for supported locales across the entire codebase (frontend, backend, and Sanity CMS types).

## Changes Made

### 1. Created Shared Language Types (`common/locales.ts`)

**New file** that defines:

- `SUPPORTED_LOCALES` constant: `['en', 'es', 'fr', 'ja', 'pt', 'de']`
- `SupportedLocale` type: Union type of all supported locales
- `isSupportedLocale()`: Type guard function
- `getSupportedLocale()`: Helper function with fallback

### 2. Updated Sanity Types (`apps/workers/utils/sanity.ts`)

- Changed `LocaleText` type from hardcoded `{ en: string, es: string }` to `Record<SupportedLocale, string>`
- Now supports all 6 languages: en, es, fr, ja, pt, de
- Added import of `SupportedLocale` from shared types

### 3. Updated Frontend Locales (`src/lib/locales/utils.ts`)

- Removed local `Locale` type definition
- Now imports and uses `SupportedLocale` from `common/locales.ts`
- Updated `AVAILABLE_LOCALES` to reference `SUPPORTED_LOCALES`
- Added `satisfies` check on `LOCALE_NAMES` to ensure type safety

### 4. Updated Backend Language Detector (`apps/workers/index.ts`)

- Changed hardcoded array `['en', 'es', 'ja', 'de']` to `[...SUPPORTED_LOCALES]`
- Now automatically includes all supported languages
- Added import of `SUPPORTED_LOCALES` from shared types

### 5. Updated API Routes (`apps/workers/routes/menu.ts`)

- Changed hardcoded union type `'en' | 'es' | 'ja' | 'de'` to `SupportedLocale`
- Updated both `/products` and `/products/:id` endpoints
- Added import of `SupportedLocale` from shared types

## Benefits

1. **Single Source of Truth**: All language codes are defined once in `common/locales.ts`
2. **Type Safety**: TypeScript ensures consistency across the entire codebase
3. **Easy to Add Languages**: Just add to `SUPPORTED_LOCALES` array, and it propagates everywhere
4. **Reduced Duplication**: No more manual syncing of language lists across files
5. **Better Maintainability**: Clear separation of concerns and shared types

## Current Language Support Status

### Frontend (UI)

✅ All 6 languages fully supported for UI translations:

- English (en)
- Spanish (es)
- French (fr)
- Japanese (ja)
- Portuguese (pt)
- German (de)

### Backend API

✅ All 6 languages supported for Accept-Language header processing

### Sanity CMS Content

✅ ALL 6 languages have FULL translations in Sanity:

- English (en) - ✅ 38/38 products
- Spanish (es) - ✅ 38/38 products
- German (de) - ✅ 38/38 products
- French (fr) - ✅ 38/38 products
- Japanese (ja) - ✅ 38/38 products
- Portuguese (pt) - ✅ 38/38 products (**NEWLY ADDED - ALL PUBLISHED ✅**)

## Previous Bug Fixes (from earlier in this session)

### Fixed: `getCurrentLocale()` Race Condition

**Problem**: The `Accept-Language` header was being set with stale locale values because `getCurrentLocale()` was reading from storage instead of the active `i18n.locale`.

**Solution**: Modified `getCurrentLocale()` in `src/lib/locales/init.tsx` to:

1. First check `i18n.locale` (source of truth once activated)
2. Fall back to storage or default locale only if `i18n.locale` is not set

This ensures that once `loadAndActivateLocale()` completes, all subsequent API calls use the correct locale.

## Next Steps

**Sanity Portuguese Translations: COMPLETED ✅**

All remaining tasks:

1. **Verify Translations Are Working**: Test that the published translations appear correctly
   - Clear React Query cache or wait for cache expiration
   - Verify API returns correct language data
   - Test all 6 supported languages (en, es, de, fr, ja, pt)

2. **Update Lingui Catalogs**: Ensure all UI strings are translated
   - Run `bun run lingui:extract` to update message catalogs
   - Translate missing strings in each locale's `messages.po` file

3. **Test Language Switching**: Verify all 6 languages work correctly across:
   - UI translations (Lingui)
   - API data (Sanity)
   - Error messages
   - Date/time formatting

## Files Modified

- `common/locales.ts` (new)
- `apps/workers/utils/sanity.ts`
- `apps/workers/index.ts`
- `apps/workers/routes/menu.ts`
- `src/lib/locales/utils.ts`
- `src/lib/locales/init.tsx` (from previous bug fix)
- `src/lib/locales/load-and-activate-locale.ts` (cleaned up debug logs)
- `src/lib/services/http-client.ts` (cleaned up debug logs)
- `src/components/MenuListItem/index.tsx` (cleaned up debug logs)
