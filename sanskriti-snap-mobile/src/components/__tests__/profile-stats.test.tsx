import React from 'react';
import { render } from '@testing-library/react-native';
import { ProfileStats } from '../ProfileStats';

describe('ProfileStats', () => {
  it('renders formatted XP and the three stat labels', async () => {
    const { getByText } = await render(
      <ProfileStats totalXP={1800} discoveries={12} quests={3} />,
    );
    expect(getByText('1,800')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('TOTAL XP')).toBeTruthy();
    expect(getByText('DISCOVERIES')).toBeTruthy();
    expect(getByText('QUESTS')).toBeTruthy();
  });
});