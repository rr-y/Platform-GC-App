import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { requestOtp } from '../../src/api/auth';

export default function MobileScreen() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    setError('');
    const normalized = mobile.startsWith('+') ? mobile : `+91${mobile}`;
    if (normalized.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      await requestOtp(normalized);
      router.push({ pathname: '/(auth)/otp', params: { mobile: normalized } });
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? 'Failed to send OTP. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text variant="headlineMedium" style={styles.title}>Welcome</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Enter your mobile number to get started
        </Text>

        <TextInput
          label="Mobile Number"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          mode="outlined"
          left={<TextInput.Affix text="+91 " />}
          style={styles.input}
          maxLength={10}
          error={!!error}
          autoFocus
        />
        <HelperText type="error" visible={!!error}>{error}</HelperText>

        <Button
          mode="contained"
          onPress={handleSend}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Send OTP
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#757575', marginBottom: 32 },
  input: { marginBottom: 4 },
  button: { marginTop: 16 },
  buttonContent: { paddingVertical: 6 },
});
