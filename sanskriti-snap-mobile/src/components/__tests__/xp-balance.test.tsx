import React from 'react';
import { render } from '@testing-library/react-native';
import XPBalance from '../XPBalance';

describe('XPBalance', () => {
  it('renders a formatted balance', async () => {
    const { getByText } = await render(<XPBalance balance={1250} />);
    expect(getByText('Available Points')).toBeTruthy();
    expect(getByText('1,250')).toBeTruthy();
  });

  it('falls back to 0 for a non-finite balance', async () => {
    const { getByText } = await render(<XPBalance balance={Number.NaN} />);
    expect(getByText('0')).toBeTruthy();
  });
});