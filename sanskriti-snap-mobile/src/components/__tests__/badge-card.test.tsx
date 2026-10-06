import React from 'react';
import { render } from '@testing-library/react-native';
import { BadgeCard } from '../BadgeCard';

describe('BadgeCard', () => {
  const unlocked = {
    id: 'b1',
    title: 'First Discovery',
    description: 'Logged your very first artifact.',
    image: 'https://img',
    isUnlocked: true,
    isNew: true,
  };

  const locked = {
    id: 'b2',
    title: 'Master Historian',
    description: 'Discover 20 artifacts.',
    image: 'https://img',
    isUnlocked: false,
  };

  it('shows the description when unlocked and no LOCKED pill', async () => {
    const { getByText, queryByText } = await render(<BadgeCard badge={unlocked} />);
    expect(getByText('First Discovery')).toBeTruthy();
    expect(getByText('Logged your very first artifact.')).toBeTruthy();
    expect(queryByText('LOCKED')).toBeNull();
  });

  it('hides the description and shows LOCKED pill when locked', async () => {
    const { getByText, queryByText } = await render(<BadgeCard badge={locked} />);
    expect(getByText('Master Historian')).toBeTruthy();
    expect(getByText('LOCKED')).toBeTruthy();
    expect(queryByText('Discover 20 artifacts.')).toBeNull();
  });
});