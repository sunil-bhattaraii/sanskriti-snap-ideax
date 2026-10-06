import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

jest.mock('expo-router', () => ({
  Icon: () => null,
}));

describe('Button', () => {
  it('renders the title text', async () => {
    const { getByText } = await render(<Button title="Save" onPress={jest.fn()} />);
    expect(getByText('Save')).toBeTruthy();
  });

  it('fires onPress when pressed', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button title="Go" onPress={onPress} />);
    await fireEvent.press(getByText('Go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders outline variant without crashing', async () => {
    const { getByText } = await render(
      <Button title="Cancel" onPress={jest.fn()} variant="outline" />,
    );
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('hides the title while loading so it cannot be pressed', async () => {
    const onPress = jest.fn();
    const { queryByText } = await render(
      <Button title="Submit" onPress={onPress} loading />,
    );
    expect(queryByText('Submit')).toBeNull();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('disables the button when disabled is set', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <Button title="Locked" onPress={onPress} disabled />,
    );
    await fireEvent.press(getByText('Locked'));
    expect(onPress).not.toHaveBeenCalled();
  });
});