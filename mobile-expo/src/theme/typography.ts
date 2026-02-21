import { Platform } from 'react-native';
export const fontFamily = {
  regular: Platform.select({ ios: 'System', android: 'Roboto' }),
  medium: Platform.select({ ios: 'System', android: 'Roboto' }),
  semiBold: Platform.select({ ios: 'System', android: 'Roboto' }),
  bold: Platform.select({ ios: 'System', android: 'Roboto' }),
};
export const fontSize = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36 } as const;
export const fontWeight = { regular: '400' as const, medium: '500' as const, semiBold: '600' as const, bold: '700' as const };
