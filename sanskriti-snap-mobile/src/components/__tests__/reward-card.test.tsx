import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RewardCard } from '../RewardCard';

describe('RewardCard', () => {
  const base = {
    id: 'r1',
    category: 'Cafe',
    categoryIcon: 'restaurant',
    businessName: 'Heritage Brews',
    title: 'Coffee Deal',
    description: 'A nice coffee.',
    image: 'https://img',
    pointsRequired: 500,
  };

  it('shows Redeem when available with a location', async () => {
    const { getByText } = await render(
      <RewardCard reward={{ ...base, location: '0.5 km away', status: 'available' }} />,
    );
    expect(getByText('Heritage Brews')).toBeTruthy();
    expect(getByText('Coffee Deal')).toBeTruthy();
    expect(getByText('Redeem')).toBeTruthy();
    expect(getByText('0.5 km away')).toBeTruthy();
  });

  it('shows Claim Reward when available without a location', async () => {
    const { getByText, queryByText } = await render(
      <RewardCard reward={{ ...base, status: 'available' }} />,
    );
    expect(getByText('Claim Reward')).toBeTruthy();
    expect(queryByText('Redeem')).toBeNull();
  });

  it('shows Claimed overlay and Reward Used once claimed', async () => {
    const { getByText } = await render(
      <RewardCard reward={{ ...base, status: 'claimed' }} />,
    );
    expect(getByText('Claimed')).toBeTruthy();
    expect(getByText('Reward Used')).toBeTruthy();
  });

  it('shows the points gap when locked', async () => {
    const { getByText } = await render(
      <RewardCard reward={{ ...base, status: 'locked', pointsNeeded: 3750 }} />,
    );
    expect(getByText('Need 3,750 more')).toBeTruthy();
  });

  it('formats large point requirements', async () => {
    const { getByText } = await render(
      <RewardCard
        reward={{ ...base, pointsRequired: 5000, status: 'locked', pointsNeeded: 3750 }}
      />,
    );
    expect(getByText('5,000')).toBeTruthy();
  });

  it('fires onRedeem from the redeem button', async () => {
    const onRedeem = jest.fn();
    const { getByText } = await render(
      <RewardCard reward={{ ...base, location: 'near', status: 'available' }} onRedeem={onRedeem} />,
    );
    await fireEvent.press(getByText('Redeem'));
    expect(onRedeem).toHaveBeenCalledTimes(1);
  });

  it('fires onClaim from the claim button', async () => {
    const onClaim = jest.fn();
    const { getByText } = await render(
      <RewardCard reward={{ ...base, status: 'available' }} onClaim={onClaim} />,
    );
    await fireEvent.press(getByText('Claim Reward'));
    expect(onClaim).toHaveBeenCalledTimes(1);
  });
});