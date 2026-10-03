import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

type MarkdownTextProps = {
  text: string;
  style?: StyleProp<TextStyle>;
};

function renderInline(line: string, style?: StyleProp<TextStyle>): ReactNode[] {
  const parts = line.split(/(\*\*.+?\*\*|__.+?__|\*.+?\*|_.+?_|`.+?`)/g);

  return parts.filter(Boolean).map((part, index) => {
    if ((part.startsWith('**') && part.endsWith('**')) ||
        (part.startsWith('__') && part.endsWith('__'))) {
      return <Text key={index} style={[style, styles.bold]}>{part.slice(2, -2)}</Text>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) ||
        (part.startsWith('_') && part.endsWith('_'))) {
      return <Text key={index} style={[style, styles.italic]}>{part.slice(1, -1)}</Text>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <Text key={index} style={[style, styles.code]}>{part.slice(1, -1)}</Text>;
    }
    return <Text key={index} style={style}>{part}</Text>;
  });
}

export default function MarkdownText({ text, style }: MarkdownTextProps) {
  return (
    <View>
      {text.split(/\r?\n/).map((rawLine, index) => {
        const heading = /^(#{1,6})\s+(.+)$/.exec(rawLine);
        const bullet = /^\s*[-*+]\s+(.+)$/.exec(rawLine);
        const content = heading?.[2] ?? bullet?.[1] ?? rawLine;

        return (
          <Text
            key={index}
            style={[
              style,
              heading && styles.heading,
              bullet && styles.bullet,
              index > 0 && styles.line,
            ]}
          >
            {bullet ? '\u2022 ' : ''}
            {renderInline(content, style)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { marginTop: 6 },
  heading: { fontWeight: '700', marginTop: 4 },
  bullet: { paddingLeft: 8 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  code: { fontFamily: 'monospace' },
});