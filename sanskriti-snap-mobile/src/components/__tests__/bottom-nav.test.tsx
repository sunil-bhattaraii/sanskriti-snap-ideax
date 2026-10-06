import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BottomNavigation from '../BottomNav';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/(tabs)/home',
}));

describe('BottomNavigation', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders the tab labels', async () => {
    const { getByText } = await render(<BottomNavigation />);
    expect(getByText('Explore')).toBeTruthy();
    expect(getByText('Home')).toBeTruthy();
  });

  it('pushes the tapped route', async () => {
    const { getByText } = await render(<BottomNavigation />);
    await fireEvent.press(getByText('Home'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('does not push on initial render', async () => {
    await render(<BottomNavigation />);
    expect(mockPush).not.toHaveBeenCalled();
  });
});