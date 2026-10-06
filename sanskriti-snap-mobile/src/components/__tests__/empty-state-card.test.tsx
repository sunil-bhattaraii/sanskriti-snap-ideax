import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyStateCard } from '../EmptyStateCard';
import { mockEmptyCollectionData } from '../../data/mockEmptyCollection';

describe('EmptyStateCard', () => {
  it('renders card title, subtitle and button text', async () => {
    const { getByText } = await render(
      <EmptyStateCard data={mockEmptyCollectionData} />,
    );
    expect(getByText('Your collection is empty.')).toBeTruthy();
    expect(
      getByText('Discover and add the locations to build your collection.'),
    ).toBeTruthy();
    expect(getByText('Add to collection')).toBeTruthy();
  });

  it('fires onAddPress when the CTA is pressed', async () => {
    const onAddPress = jest.fn();
    const { getByText } = await render(
      <EmptyStateCard data={mockEmptyCollectionData} onAddPress={onAddPress} />,
    );
    await fireEvent.press(getByText('Add to collection'));
    expect(onAddPress).toHaveBeenCalledTimes(1);
  });
});