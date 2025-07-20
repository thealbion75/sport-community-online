
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Enhanced EGSport Brand Colors
				'egsport-blue': {
					50: 'hsl(var(--egsport-blue-50))',
					100: 'hsl(var(--egsport-blue-100))',
					200: 'hsl(var(--egsport-blue-200))',
					300: 'hsl(var(--egsport-blue-300))',
					400: 'hsl(var(--egsport-blue-400))',
					500: 'hsl(var(--egsport-blue-500))',
					600: 'hsl(var(--egsport-blue-600))',
					700: 'hsl(var(--egsport-blue-700))',
					800: 'hsl(var(--egsport-blue-800))',
					900: 'hsl(var(--egsport-blue-900))',
					DEFAULT: 'hsl(var(--egsport-blue-500))',
				},
				'egsport-green': {
					50: 'hsl(var(--egsport-green-50))',
					100: 'hsl(var(--egsport-green-100))',
					200: 'hsl(var(--egsport-green-200))',
					300: 'hsl(var(--egsport-green-300))',
					400: 'hsl(var(--egsport-green-400))',
					500: 'hsl(var(--egsport-green-500))',
					600: 'hsl(var(--egsport-green-600))',
					700: 'hsl(var(--egsport-green-700))',
					800: 'hsl(var(--egsport-green-800))',
					900: 'hsl(var(--egsport-green-900))',
					DEFAULT: 'hsl(var(--egsport-green-500))',
				},
				// Semantic Colors
				success: 'hsl(var(--success))',
				warning: 'hsl(var(--warning))',
				error: 'hsl(var(--error))',
				info: 'hsl(var(--info))',
				// Legacy support
				'egsport-dark': '#1A1F2C',
			},
			fontFamily: {
				sans: 'var(--font-sans)',
				mono: 'var(--font-mono)',
			},
			fontSize: {
				xs: 'var(--text-xs)',
				sm: 'var(--text-sm)',
				base: 'var(--text-base)',
				lg: 'var(--text-lg)',
				xl: 'var(--text-xl)',
				'2xl': 'var(--text-2xl)',
				'3xl': 'var(--text-3xl)',
				'4xl': 'var(--text-4xl)',
				'5xl': 'var(--text-5xl)',
			},
			lineHeight: {
				tight: 'var(--leading-tight)',
				normal: 'var(--leading-normal)',
				relaxed: 'var(--leading-relaxed)',
			},
			spacing: {
				1: 'var(--space-1)',
				2: 'var(--space-2)',
				3: 'var(--space-3)',
				4: 'var(--space-4)',
				5: 'var(--space-5)',
				6: 'var(--space-6)',
				8: 'var(--space-8)',
				10: 'var(--space-10)',
				12: 'var(--space-12)',
				16: 'var(--space-16)',
				20: 'var(--space-20)',
				24: 'var(--space-24)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
