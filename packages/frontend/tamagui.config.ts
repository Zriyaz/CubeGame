import { config as configBase } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'
import { createAnimations } from '@tamagui/animations-css'

// Game-specific animations
const animations = createAnimations({
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  lazy: 'cubic-bezier(0.42, 0, 0.58, 1)',
  quick: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  cellular: 'cubic-bezier(0.4, 0, 0.2, 1)',
})

// Game-specific colors - Dark Gaming Theme
const gameColors = {
  // Neon accent colors with glow effect
  neonBlue: '#00D4FF',
  neonCyan: '#00F0FF',
  neonPink: '#FF0080',
  neonGreen: '#00FF88',
  neonYellow: '#FFD700',
  neonOrange: '#FF6B00',
  neonPurple: '#B200FF',
  neonRed: '#FF0040',
  
  // Player colors with better contrast
  player1: '#FF3366',  // Vibrant Red-Pink
  player2: '#00BFFF',  // Sky Blue
  player3: '#00FF7F',  // Spring Green
  player4: '#FFEB3B',  // Material Yellow
  player5: '#E040FB',  // Purple Accent
  player6: '#FF6E40',  // Deep Orange
  
  // Dark gaming UI colors
  background: '#0A0A0F',       // Very dark blue-black
  surface: '#12121A',          // Slightly lighter surface
  surfaceHover: '#1A1A25',     // Hover state
  surfacePress: '#222230',     // Press state
  
  // Grid and game board
  gridLine: 'rgba(255, 255, 255, 0.05)',
  gridLineActive: 'rgba(0, 212, 255, 0.2)',
  cellEmpty: 'rgba(255, 255, 255, 0.02)',
  cellHover: 'rgba(0, 212, 255, 0.1)',
  gameBackground: '#050507',
  boardShadow: 'rgba(0, 212, 255, 0.4)',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B8B8C8',
  textMuted: '#6B6B7B',
  
  // Status colors
  success: '#00FF88',
  error: '#FF3366',
  warning: '#FFD700',
  info: '#00D4FF',
  
  // Borders
  borderColor: 'rgba(255, 255, 255, 0.08)',
  borderColorHover: 'rgba(0, 212, 255, 0.3)',
  borderColorFocus: 'rgba(0, 212, 255, 0.5)',
}

// Game-specific tokens
const gameTokens = {
  size: {
    cellSize: 60,
    cellSizeSm: 40,
    cellSizeLg: 80,
    gridGap: 2,
  },
  radius: {
    cell: 8,
    board: 16,
  },
  zIndex: {
    cell: 1,
    cellHover: 10,
    cellActive: 20,
    particle: 100,
    modal: 1000,
  },
}

// Create custom config
export const config = createTamagui({
  ...configBase,
  animations,
  themes: {
    dark: {
      ...configBase.themes.dark,
      // Core colors
      background: gameColors.background,
      backgroundHover: gameColors.surfaceHover,
      backgroundPress: gameColors.surfacePress,
      backgroundFocus: gameColors.surfaceHover,
      backgroundStrong: gameColors.gameBackground,
      backgroundTransparent: 'rgba(10, 10, 15, 0.8)',
      
      // Surface colors
      surface: gameColors.surface,
      surfaceHover: gameColors.surfaceHover,
      surfacePress: gameColors.surfacePress,
      
      // Text colors
      color: gameColors.textPrimary,
      colorHover: gameColors.textPrimary,
      colorPress: gameColors.textSecondary,
      colorFocus: gameColors.textPrimary,
      
      // Borders
      borderColor: gameColors.borderColor,
      borderColorHover: gameColors.borderColorHover,
      borderColorPress: gameColors.borderColorFocus,
      borderColorFocus: gameColors.borderColorFocus,
      
      // Include all game colors
      ...gameColors,
      
      // Override some specific colors for dark theme
      text: gameColors.textPrimary,
      textMuted: gameColors.textMuted,
      
      // Card colors
      cardBackground: gameColors.surface,
      cardBorder: gameColors.borderColor,
      
      // Button colors
      buttonBackground: gameColors.surface,
      buttonBackgroundHover: gameColors.surfaceHover,
      buttonBackgroundPress: gameColors.surfacePress,
      buttonText: gameColors.textPrimary,
    },
    light: {
      ...configBase.themes.light,
      // Keep light theme for now but we'll use dark by default
      ...gameColors,
    },
  },
  tokens: {
    ...configBase.tokens,
    color: {
      ...configBase.tokens.color,
      ...gameColors,
    },
    size: {
      ...configBase.tokens.size,
      ...gameTokens.size,
    },
    radius: {
      ...configBase.tokens.radius,
      ...gameTokens.radius,
    },
    zIndex: {
      ...configBase.tokens.zIndex,
      ...gameTokens.zIndex,
    },
  },
  fonts: {
    ...configBase.fonts,
    heading: {
      ...configBase.fonts.heading,
      family: 'Orbitron, monospace',
    },
  },
})

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config