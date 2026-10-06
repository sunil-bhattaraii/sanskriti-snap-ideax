import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LeaderboardTabs } from '../LeaderboardTabs';

describe('LeaderboardTabs', () => {
  it('renders both tabs', async () => {
    const { getByText } = await render(
      <LeaderboardTabs activeTab="GLOBAL" onTabChange={jest.fn()} />,
    );
    expect(getByText('GLOBAL')).toBeTruthy();
    expect(getByText('FRIENDS')).toBeTruthy();
  });

  it('reports tab changes', async () => {
    const onTabChange = jest.fn();
    const { getByText } = await render(
      <LeaderboardTabs activeTab="GLOBAL" onTabChange={onTabChange} />,
    );
    await fireEvent.press(getByText('FRIENDS'));
    expect(onTabChange).toHaveBeenCalledWith('FRIENDS');
    await fireEvent.press(getByText('GLOBAL'));
    expect(onTabChange).toHaveBeenCalledWith('GLOBAL');
  });
});