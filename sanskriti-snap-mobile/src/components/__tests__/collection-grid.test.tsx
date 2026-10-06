import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CollectionGrid from '../collection/CollectionGrid';

describe('CollectionGrid', () => {
  const items = [
    {
      id: 'a1',
      title: 'Krishna Mandir',
      location: 'Patan',
      xp: 150,
      imageUrl: 'https://img',
      rarity: 'Rare' as const,
      isDiscovered: true,
    },
    {
      id: 'a2',
      title: 'Golden Window',
      location: 'Bhaktapur',
      xp: 300,
      imageUrl: 'https://img',
      rarity: 'Legendary' as const,
      isDiscovered: true,
    },
    {
      id: 'a3',
      title: '',
      location: '',
      xp: 0,
      rarity: 'Common' as const,
      isDiscovered: false,
    },
  ];

  it('renders a row per discovered and undiscovered item', async () => {
    const { getByText } = await render(<CollectionGrid items={items} />);
    expect(getByText('Krishna Mandir')).toBeTruthy();
    expect(getByText('Golden Window')).toBeTruthy();
    expect(getByText('Discover to unlock')).toBeTruthy();
  });

  it('fires onItemPress with the tapped item', async () => {
    const onItemPress = jest.fn();
    const { getByText } = await render(
      <CollectionGrid items={items} onItemPress={onItemPress} />,
    );
    await fireEvent.press(getByText('Golden Window'));
    expect(onItemPress).toHaveBeenCalledWith(items[1]);
  });
});