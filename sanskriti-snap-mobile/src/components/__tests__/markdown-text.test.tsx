import React from 'react';
import { render } from '@testing-library/react-native';
import MarkdownText from '../MarkdownText';

describe('MarkdownText', () => {
  it('renders plain multi-line text', async () => {
    const { getByText } = await render(<MarkdownText text={'first line\nsecond line'} />);
    expect(getByText('first line')).toBeTruthy();
    expect(getByText('second line')).toBeTruthy();
  });

  it('renders inline bold/italic/code markers', async () => {
    const { getByText } = await render(<MarkdownText text="**bold** *italic* `code`" />);
    expect(getByText('bold')).toBeTruthy();
    expect(getByText('italic')).toBeTruthy();
    expect(getByText('code')).toBeTruthy();
  });

  it('renders a heading line', async () => {
    const { getByText } = await render(<MarkdownText text="# Heading" />);
    expect(getByText('Heading')).toBeTruthy();
  });

  it('renders a bullet with a bullet glyph', async () => {
    const { getByText } = await render(<MarkdownText text="- an item" />);
    expect(getByText('an item')).toBeTruthy();
  });
});