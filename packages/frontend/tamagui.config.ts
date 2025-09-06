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

// Game-specific colors
const gameColors = {
  // Neon colors for gaming feel
  neonBlue: 'hsl(180, 100%, 50%)',
  neonPink: 'hsl(300, 100%, 50%)',
  neonGreen: 'hsl(120, 100%, 50%)',
  neonYellow: 'hsl(60, 100%, 50%)',
  neonOrange: 'hsl(30, 100%, 50%)',
  neonPurple: 'hsl(270, 100%, 50%)',
  
  // Player colors
  player1: 'hsl(0, 100%, 60%)',
  player2: 'hsl(210, 100%, 60%)',
  player3: 'hsl(120, 100%, 60%)',
  player4: 'hsl(60, 100%, 60%)',
  player5: 'hsl(280, 100%, 60%)',
  player6: 'hsl(30, 100%, 60%)',
  
  // Game UI colors
  gridLine: 'hsl(0, 0%, 20%)',
  cellEmpty: 'hsl(0, 0%, 10%)',
  cellHover: 'hsl(0, 0%, 15%)',
  gameBackground: 'hsl(0, 0%, 5%)',
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
    ...configBase.themes,
    dark_game: {
      ...configBase.themes.dark,
      background: gameColors.gameBackground,
      backgroundHover: gameColors.cellHover,
      backgroundPress: gameColors.cellEmpty,
      backgroundFocus: gameColors.cellHover,
      borderColor: gameColors.gridLine,
      borderColorHover: gameColors.neonBlue,
      borderColorPress: gameColors.neonBlue,
      borderColorFocus: gameColors.neonBlue,
      ...gameColors,
    },
    light_game: {
      ...configBase.themes.light,
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