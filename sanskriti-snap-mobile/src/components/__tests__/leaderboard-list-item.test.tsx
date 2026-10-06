import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LeaderboardListItem from '../Leaderboard/LeaderboardListItem';

describe('LeaderboardListItem', () => {
  const user = {
    id: 'u1',
    username: 'ramesh',
    display_name: 'Ramesh Karki',
    profile_image_url: null,
    lifetime_xp: 4250,
    rank: 3,
    level: 5,
  };

  it('renders rank, name, level and formatted XP', async () => {
    const { getByText } = await render(<LeaderboardListItem user={user} />);
    expect(getByText('3')).toBeTruthy();
    expect(getByText('Ramesh Karki')).toBeTruthy();
    expect(getByText('Lvl 5')).toBeTruthy();
    expect(getByText('4,250 XP')).toBeTruthy();
  });

  it('renders a You badge for the current user', async () => {
    const { getByText } = await render(
      <LeaderboardListItem user={{ ...user, isCurrentUser: true }} />,
    );
    expect(getByText('You')).toBeTruthy();
  });

  it('does not render a You badge for other users', async () => {
    const { queryByText } = await render(<LeaderboardListItem user={user} />);
    expect(queryByText('You')).toBeNull();
  });

  it('fires onPress with the user', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <LeaderboardListItem user={user} onPress={onPress} />,
    );
    await fireEvent.press(getByText('Ramesh Karki'));
    expect(onPress).toHaveBeenCalledWith(user);
  });
});