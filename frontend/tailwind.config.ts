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
			padding: 'var(--container-padding)',
			screens: {
				sm: 'var(--breakpoint-sm)',
				md: 'var(--breakpoint-md)',
				lg: 'var(--breakpoint-lg)',
				xl: 'var(--breakpoint-xl)',
				'2xl': 'var(--breakpoint-2xl)'
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
					50: 'hsl(var(--color-primary-50))',
					100: 'hsl(var(--color-primary-100))',
					200: 'hsl(var(--color-primary-200))',
					300: 'hsl(var(--color-primary-300))',
					400: 'hsl(var(--color-primary-400))',
					500: 'hsl(var(--color-primary-500))',
					600: 'hsl(var(--color-primary-600))',
					700: 'hsl(var(--color-primary-700))',
					800: 'hsl(var(--color-primary-800))',
					900: 'hsl(var(--color-primary-900))',
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					50: 'hsl(var(--color-secondary-50))',
					100: 'hsl(var(--color-secondary-100))',
					200: 'hsl(var(--color-secondary-200))',
					300: 'hsl(var(--color-secondary-300))',
					400: 'hsl(var(--color-secondary-400))',
					500: 'hsl(var(--color-secondary-500))',
					600: 'hsl(var(--color-secondary-600))',
					700: 'hsl(var(--color-secondary-700))',
					800: 'hsl(var(--color-secondary-800))',
					900: 'hsl(var(--color-secondary-900))',
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				accent: {
					50: 'hsl(var(--color-accent-50))',
					100: 'hsl(var(--color-accent-100))',
					200: 'hsl(var(--color-accent-200))',
					300: 'hsl(var(--color-accent-300))',
					400: 'hsl(var(--color-accent-400))',
					500: 'hsl(var(--color-accent-500))',
					600: 'hsl(var(--color-accent-600))',
					700: 'hsl(var(--color-accent-700))',
					800: 'hsl(var(--color-accent-800))',
					900: 'hsl(var(--color-accent-900))',
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				muted: {
					50: 'hsl(var(--color-muted-50))',
					100: 'hsl(var(--color-muted-100))',
					200: 'hsl(var(--color-muted-200))',
					300: 'hsl(var(--color-muted-300))',
					400: 'hsl(var(--color-muted-400))',
					500: 'hsl(var(--color-muted-500))',
					600: 'hsl(var(--color-muted-600))',
					700: 'hsl(var(--color-muted-700))',
					800: 'hsl(var(--color-muted-800))',
					900: 'hsl(var(--color-muted-900))',
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Semantic colors
				success: {
					DEFAULT: 'hsl(var(--color-success))',
					foreground: 'hsl(var(--color-success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--color-warning))',
					foreground: 'hsl(var(--color-warning-foreground))'
				},
				error: {
					DEFAULT: 'hsl(var(--color-error))',
					foreground: 'hsl(var(--color-error-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--color-info))',
					foreground: 'hsl(var(--color-info-foreground))'
				},
				// Agricultural theme colors
				harvest: {
					DEFAULT: 'hsl(var(--harvest-gold))',
					gold: 'hsl(var(--harvest-gold))'
				},
				earth: 'hsl(var(--earth-brown))',
				leaf: 'hsl(var(--leaf-green))',
				sky: 'hsl(var(--sky-blue))',
				soil: 'hsl(var(--color-soil-dark))',
				wheat: 'hsl(var(--color-wheat-yellow))',
				water: 'hsl(var(--color-water-blue))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			spacing: {
				0: 'var(--spacing-0)',
				1: 'var(--spacing-1)',
				2: 'var(--spacing-2)',
				3: 'var(--spacing-3)',
				4: 'var(--spacing-4)',
				5: 'var(--spacing-5)',
				6: 'var(--spacing-6)',
				8: 'var(--spacing-8)',
				10: 'var(--spacing-10)',
				12: 'var(--spacing-12)',
				16: 'var(--spacing-16)',
				20: 'var(--spacing-20)',
				24: 'var(--spacing-24)',
				32: 'var(--spacing-32)'
			},
			fontSize: {
				xs: ['var(--font-size-xs)', { lineHeight: 'var(--line-height-normal)' }],
				sm: ['var(--font-size-sm)', { lineHeight: 'var(--line-height-normal)' }],
				base: ['var(--font-size-base)', { lineHeight: 'var(--line-height-normal)' }],
				lg: ['var(--font-size-lg)', { lineHeight: 'var(--line-height-normal)' }],
				xl: ['var(--font-size-xl)', { lineHeight: 'var(--line-height-tight)' }],
				'2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-tight)' }],
				'3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-tight)' }],
				'4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)' }],
				'5xl': ['var(--font-size-5xl)', { lineHeight: 'var(--line-height-none)' }],
				'6xl': ['var(--font-size-6xl)', { lineHeight: 'var(--line-height-none)' }]
			},
			fontFamily: {
				sans: ['var(--font-sans)'],
				mono: ['var(--font-mono)']
			},
			fontWeight: {
				light: 'var(--font-weight-light)',
				normal: 'var(--font-weight-normal)',
				medium: 'var(--font-weight-medium)',
				semibold: 'var(--font-weight-semibold)',
				bold: 'var(--font-weight-bold)',
				extrabold: 'var(--font-weight-extrabold)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-earth': 'var(--gradient-earth)',
				'gradient-sky': 'var(--gradient-sky)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-sunset': 'var(--gradient-sunset)'
			},
			boxShadow: {
				xs: 'var(--shadow-xs)',
				sm: 'var(--shadow-sm)',
				DEFAULT: 'var(--shadow-base)',
				md: 'var(--shadow-md)',
				lg: 'var(--shadow-lg)',
				xl: 'var(--shadow-xl)',
				'2xl': 'var(--shadow-2xl)',
				inner: 'var(--shadow-inner)',
				soft: 'var(--shadow-soft)',
				strong: 'var(--shadow-strong)',
				glow: 'var(--shadow-glow)',
				earth: 'var(--shadow-earth)'
			},
			transitionDuration: {
				fast: 'var(--transition-duration-fast)',
				DEFAULT: 'var(--transition-duration-base)',
				slow: 'var(--transition-duration-slow)',
				slower: 'var(--transition-duration-slower)'
			},
			transitionTimingFunction: {
				smooth: 'var(--transition-timing-smooth)',
				bounce: 'var(--transition-timing-bounce)'
			},
			borderRadius: {
				none: 'var(--radius-none)',
				sm: 'var(--radius-sm)',
				DEFAULT: 'var(--radius-base)',
				md: 'var(--radius-md)',
				lg: 'var(--radius-lg)',
				xl: 'var(--radius-xl)',
				'2xl': 'var(--radius-2xl)',
				full: 'var(--radius-full)'
			},
			zIndex: {
				base: 'var(--z-index-base)',
				dropdown: 'var(--z-index-dropdown)',
				sticky: 'var(--z-index-sticky)',
				fixed: 'var(--z-index-fixed)',
				'modal-backdrop': 'var(--z-index-modal-backdrop)',
				modal: 'var(--z-index-modal)',
				popover: 'var(--z-index-popover)',
				tooltip: 'var(--z-index-tooltip)',
				notification: 'var(--z-index-notification)'
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
