import { Dimensions, useWindowDimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const breakpoints = {
  sm: 360,
  md: 480,
  lg: 768,
  xl: 1024,
} as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isSmall = width < breakpoints.sm;
  const isMedium = width >= breakpoints.sm && width < breakpoints.md;
  const isLarge = width >= breakpoints.md;
  const isLandscape = width > height;

  const padding = {
    horizontal: isSmall ? 12 : isMedium ? 16 : 20,
    vertical: isSmall ? 12 : 16,
  };

  const scale = {
    base: Math.min(width / 375, 1.2),
    text: Math.min(width / 375, 1.15),
  };

  return {
    width,
    height,
    isSmall,
    isMedium,
    isLarge,
    isLandscape,
    padding,
    scale,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
  };
}

export function responsiveValue<T>(values: { sm?: T; md?: T; lg?: T }, width: number): T | undefined {
  if (width < breakpoints.sm && values.sm !== undefined) return values.sm;
  if (width < breakpoints.md && values.md !== undefined) return values.md;
  return values.lg;
}

export function wp(percent: number): number {
  return (SCREEN_WIDTH * percent) / 100;
}

export function hp(percent: number): number {
  return (SCREEN_HEIGHT * percent) / 100;
}
