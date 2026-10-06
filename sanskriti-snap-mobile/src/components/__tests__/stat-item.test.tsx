import React from 'react';
import { render } from '@testing-library/react-native';
import StatItem from '../StatItem';

describe('StatItem', () => {
  const base = {
    value: '12',
    label: 'Discoveries',
    icon: 'location' as const,
    iconColor: '#9C4221',
  };

  it('renders value and label', async () => {
    const { getByText } = await render(<StatItem {...base} />);
    expect(getByText('12')).toBeTruthy();
    expect(getByText('Discoveries')).toBeTruthy();
  });

  it('applies an extra style without crashing', async () => {
    const { getByText } = await render(<StatItem {...base} style={{ marginTop: 4 }} />);
    expect(getByText('12')).toBeTruthy();
  });
});