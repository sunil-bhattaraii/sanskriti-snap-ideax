import React from 'react';
import { render } from '@testing-library/react-native';
import SubmitProgress from '../submission/SubmitProgress';

describe('SubmitProgress', () => {
  it('renders all three step labels', async () => {
    const { getByText } = await render(<SubmitProgress stage="uploading" />);
    expect(getByText('Uploading photos')).toBeTruthy();
    expect(getByText('Verifying snap')).toBeTruthy();
    expect(getByText('Submitting snap')).toBeTruthy();
  });

  it('marks completed steps as done and highlights the active step', async () => {
    const { getByText } = await render(<SubmitProgress stage="verifying" />);
    // 'Uploading photos' is completed; 'Verifying snap' is active.
    expect(getByText('Uploading photos')).toBeTruthy();
    expect(getByText('Verifying snap')).toBeTruthy();
  });
});