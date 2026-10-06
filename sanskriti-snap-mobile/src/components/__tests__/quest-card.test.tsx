import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuestCard } from '../QuestCard';

describe('QuestCard', () => {
  const quest = {
    id: 'q1',
    title: 'Hidden Patan',
    description: 'Discover 5 overlooked shrines.',
    image: 'https://img',
    currentProgress: 3,
    totalProgress: 5,
    xpReward: 500,
    hasBadgeReward: true,
    isFeatured: true,
  };

  it('renders title, description and progress percentage', async () => {
    const { getByText } = await render(<QuestCard quest={quest} />);
    expect(getByText('Hidden Patan')).toBeTruthy();
    expect(getByText('Discover 5 overlooked shrines.')).toBeTruthy();
    expect(getByText('3/5 (60%)')).toBeTruthy();
    expect(getByText('+500 XP')).toBeTruthy();
  });

  it('does not crash on a zero total', async () => {
    const { getByText } = await render(
      <QuestCard quest={{ ...quest, totalProgress: 0 }} />,
    );
    expect(getByText('Hidden Patan')).toBeTruthy();
  });

  it('fires onPress when pressed', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<QuestCard quest={quest} onPress={onPress} />);
    await fireEvent.press(getByText('Hidden Patan'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});