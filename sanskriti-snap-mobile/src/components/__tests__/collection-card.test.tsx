import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CollectionCard } from '../CollectionCard';

describe('CollectionCard', () => {
  const discovered = {
    id: 'a1',
    name: 'Golden Window',
    location: 'Bhaktapur',
    xp: 300,
    rarity: 'Legendary' as const,
    image: 'https://img',
    discovered: true,
  };

  const undiscovered = {
    id: 'a2',
    name: '',
    location: '',
    xp: 0,
    rarity: 'Common' as const,
    image: '',
    discovered: false,
  };

  it('shows name, location, XP and rarity when discovered', async () => {
    const { getByText } = await render(<CollectionCard item={discovered} />);
    expect(getByText('Golden Window')).toBeTruthy();
    expect(getByText('Bhaktapur')).toBeTruthy();
    expect(getByText('+300 XP')).toBeTruthy();
    expect(getByText('Legendary')).toBeTruthy();
  });

  it('shows the locked placeholder when not discovered', async () => {
    const { getByText, queryByText } = await render(<CollectionCard item={undiscovered} />);
    expect(getByText('Discover to unlock')).toBeTruthy();
    expect(queryByText('+0 XP')).toBeNull();
  });

  it('fires onPress on a discovered item', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<CollectionCard item={discovered} onPress={onPress} />);
    await fireEvent.press(getByText('Golden Window'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});