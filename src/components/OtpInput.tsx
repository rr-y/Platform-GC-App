import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

type Props = {
  length?: number;
  onComplete: (otp: string) => void;
};

export function OtpInput({ length = 6, onComplete }: Props) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);

    if (digit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    const filled = next.join('');
    if (filled.length === length) {
      onComplete(filled);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {values.map((val, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputs.current[i] = ref; }}
          style={[styles.box, val ? styles.filled : undefined]}
          value={val}
          keyboardType="number-pad"
          maxLength={1}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          textAlign="center"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginVertical: 24,
  },
  box: {
    width: 46,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#bdbdbd',
    borderRadius: 8,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
    backgroundColor: '#fafafa',
  },
  filled: {
    borderColor: '#6200ee',
    backgroundColor: '#f3e5f5',
  },
});
