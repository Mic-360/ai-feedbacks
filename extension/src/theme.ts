export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export type ExtensionThemeTokens = {
	name: ResolvedTheme;
	colorScheme: ResolvedTheme;
	brand: string;
	brandStrong: string;
	brandSoft: string;
	background: string;
	surface: string;
	surfaceElevated: string;
	surfaceMuted: string;
	text: string;
	textMuted: string;
	textSubtle: string;
	border: string;
	borderStrong: string;
	inputBackground: string;
	inputBorder: string;
	primaryBackground: string;
	primaryText: string;
	secondaryBackground: string;
	secondaryText: string;
	link: string;
	danger: string;
	dangerBackground: string;
	success: string;
	successText: string;
	overlay: string;
	overlayStrong: string;
	selectionBorder: string;
	selectionFill: string;
	shadow: string;
	shadowStrong: string;
	focusRing: string;
};

export const THEME_STORAGE_KEY = 'aiFeedbackThemePreference';

export const THEME_PREFERENCES: ThemePreference[] = ['system', 'light', 'dark'];

export const themeLabels: Record<ThemePreference, string> = {
	system: 'System',
	light: 'Light',
	dark: 'Dark',
};

export const extensionThemes: Record<ResolvedTheme, ExtensionThemeTokens> = {
	light: {
		name: 'light',
		colorScheme: 'light',
		brand: '#87ae73',
		brandStrong: '#5f844e',
		brandSoft: '#eef6ea',
		background: '#f7faf5',
		surface: '#ffffff',
		surfaceElevated: '#ffffff',
		surfaceMuted: '#f1f6ee',
		text: '#172015',
		textMuted: '#53604e',
		textSubtle: '#75806f',
		border: '#dce8d7',
		borderStrong: '#bdd0b3',
		inputBackground: '#ffffff',
		inputBorder: '#c8d8c1',
		primaryBackground: '#172015',
		primaryText: '#ffffff',
		secondaryBackground: '#f1f6ee',
		secondaryText: '#263323',
		link: '#4f7fc8',
		danger: '#b9322b',
		dangerBackground: '#fff0ee',
		success: '#6f965d',
		successText: '#ffffff',
		overlay: 'rgba(14, 20, 12, 0.34)',
		overlayStrong: 'rgba(14, 20, 12, 0.58)',
		selectionBorder: '#87ae73',
		selectionFill: 'rgba(135, 174, 115, 0.18)',
		shadow: '0 14px 34px rgba(23, 32, 21, 0.12)',
		shadowStrong: '0 24px 60px rgba(23, 32, 21, 0.22)',
		focusRing: '0 0 0 3px rgba(135, 174, 115, 0.32)',
	},
	dark: {
		name: 'dark',
		colorScheme: 'dark',
		brand: '#9bc486',
		brandStrong: '#b8daa8',
		brandSoft: '#23351f',
		background: '#0d120c',
		surface: '#151c13',
		surfaceElevated: '#1b2518',
		surfaceMuted: '#202c1d',
		text: '#eff7eb',
		textMuted: '#b8c8af',
		textSubtle: '#8fa184',
		border: '#33442d',
		borderStrong: '#4b6341',
		inputBackground: '#10170f',
		inputBorder: '#405636',
		primaryBackground: '#9bc486',
		primaryText: '#0d120c',
		secondaryBackground: '#22301e',
		secondaryText: '#eff7eb',
		link: '#9ec7ff',
		danger: '#ff8f84',
		dangerBackground: '#321918',
		success: '#9bc486',
		successText: '#0d120c',
		overlay: 'rgba(0, 0, 0, 0.48)',
		overlayStrong: 'rgba(0, 0, 0, 0.72)',
		selectionBorder: '#b8daa8',
		selectionFill: 'rgba(155, 196, 134, 0.22)',
		shadow: '0 16px 40px rgba(0, 0, 0, 0.42)',
		shadowStrong: '0 28px 72px rgba(0, 0, 0, 0.58)',
		focusRing: '0 0 0 3px rgba(155, 196, 134, 0.34)',
	},
};

export function isThemePreference(value: unknown): value is ThemePreference {
	return typeof value === 'string' && THEME_PREFERENCES.includes(value as ThemePreference);
}

export function getSystemTheme(): ResolvedTheme {
	if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	return 'light';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
	return preference === 'system' ? getSystemTheme() : preference;
}

export function getThemeTokens(preferenceOrTheme: ThemePreference | ResolvedTheme): ExtensionThemeTokens {
	const resolved = preferenceOrTheme === 'system' ? getSystemTheme() : preferenceOrTheme;
	return extensionThemes[resolved];
}

export async function getStoredThemePreference(): Promise<ThemePreference> {
	try {
		if (typeof chrome === 'undefined' || !chrome.storage?.local) return 'system';
		const result = await chrome.storage.local.get(THEME_STORAGE_KEY);
		const value = result[THEME_STORAGE_KEY];
		return isThemePreference(value) ? value : 'system';
	} catch (_e) {
		return 'system';
	}
}

export async function setStoredThemePreference(preference: ThemePreference): Promise<void> {
	if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
	await chrome.storage.local.set({ [THEME_STORAGE_KEY]: preference });
}
