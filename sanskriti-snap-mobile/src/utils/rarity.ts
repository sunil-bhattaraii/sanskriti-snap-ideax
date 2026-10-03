import { COLORS } from '../constants/colors'; // Adjust path if needed

export const getRarityInfo = (xpValue: number) => {
  if (xpValue >= 200) {
    return {
      label: 'LEGENDARY',
      color: COLORS.primary,
      bgColor: 'rgba(212, 175, 55, 0.1)',
    };
  } else if (xpValue >= 150) {
    return {
      label: 'RARE',
      color: '#4299E1',
      bgColor: 'rgba(66, 153, 225, 0.1)',
    };
  } else {
    return {
      label: 'COMMON',
      color: COLORS.tertiary,
      bgColor: 'rgba(203, 213, 224, 0.3)',
    };
  }
};
