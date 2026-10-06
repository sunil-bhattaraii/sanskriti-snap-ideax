import React from 'react';
import { render } from '@testing-library/react-native';
import VerificationStatus from '../verification/VerificationStatus';

describe('VerificationStatus', () => {
  const place = {
    placeName: 'Krishna Mandir',
    location: 'Patan Durbar Square',
  };

  it('renders VERIFYING... state', async () => {
    const { getByText } = await render(
      <VerificationStatus data={{ verificationStatus: 'verifying', ...place }} />,
    );
    expect(getByText('VERIFYING...')).toBeTruthy();
    expect(getByText('Discovery Pending')).toBeTruthy();
    expect(getByText('Krishna Mandir')).toBeTruthy();
    expect(getByText('Patan Durbar Square')).toBeTruthy();
  });

  it('renders ANALYZING... state', async () => {
    const { getByText } = await render(
      <VerificationStatus data={{ verificationStatus: 'analyzing', ...place }} />,
    );
    expect(getByText('ANALYZING...')).toBeTruthy();
  });

  it('defaults to PENDING for unknown statuses', async () => {
    const { getByText } = await render(
      <VerificationStatus data={{ verificationStatus: 'queued', ...place }} />,
    );
    expect(getByText('PENDING')).toBeTruthy();
  });
});