import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressCircle } from '../ProgressCircle';

describe('ProgressCircle', () => {
  it('renders current and total progress', async () => {
    const { getByText } = await render(
      <ProgressCircle progress={{ current: 8, total: 24 }} />,
    );
    expect(getByText('8')).toBeTruthy();
    expect(getByText('OF 24')).toBeTruthy();
  });
});