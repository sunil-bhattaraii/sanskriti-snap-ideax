export interface RarityInfo {
  label: string;
  color: string;
  bgColor: string;
}

export function getRarityInfo(xpValue: number): RarityInfo {
  if (xpValue >= 400) {
    return {
      label: 'ANCIENT',
      color: '#B45309',
      bgColor: '#FEF3C7',
    };
  }
  if (xpValue >= 250) {
    return {
      label: 'EPIC',
      color: '#7C3AED',
      bgColor: '#EDE9FE',
    };
  }
  if (xpValue >= 150) {
    return {
      label: 'RARE',
      color: '#2563EB',
      bgColor: '#DBEAFE',
    };
  }
  return {
    label: 'COMMON',
    color: '#059669',
    bgColor: '#D1FAE5',
  };
}
