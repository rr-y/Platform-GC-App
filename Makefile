.PHONY: dev web android ios kill install build-apk build-aab

# ── Local development ─────────────────────────────────────────────────────────

dev:
	@$(MAKE) kill
	npx expo start

web:
	@$(MAKE) kill
	npx expo start --web

android:
	@$(MAKE) kill
	npx expo start --android

ios:
	@$(MAKE) kill
	npx expo start --ios

# ── Kill Expo dev server ──────────────────────────────────────────────────────

kill:
	@pkill -f "expo start" 2>/dev/null || true
	@pkill -f "react-native" 2>/dev/null || true

# ── Dependencies ──────────────────────────────────────────────────────────────

install:
	npm install --legacy-peer-deps

# ── EAS builds ───────────────────────────────────────────────────────────────

build-apk:
	eas build --platform android --profile preview

build-aab:
	eas build --platform android --profile production
