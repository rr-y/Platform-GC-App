import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, HelperText } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { verifyOtp, requestOtp } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/auth';
import { OtpInput } from '../../src/components/OtpInput';

export default function OtpScreen() {
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const handleVerify = async (otp: string) => {
    setError('');
    setLoading(true);
    try {
      const data = await verifyOtp(mobile, otp);
      await login(data.access_token, data.refresh_token, data.user);
      router.replace('/(tabs)/');
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    setError('');
    setResending(true);
    try {
      await requestOtp(mobile);
      setResendMsg('OTP resent!');
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Verify OTP</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Enter the 6-digit code sent to{'\n'}
        <Text style={styles.mobile}>{mobile}</Text>
      </Text>

      <OtpInput onComplete={handleVerify} />

      {loading && <Text style={styles.hint}>Verifying...</Text>}

      <HelperText type="error" visible={!!error}>{error}</HelperText>
      <HelperText type="info" visible={!!resendMsg}>{resendMsg}</HelperText>

      <Button
        mode="text"
        onPress={handleResend}
        loading={resending}
        disabled={resending || loading}
        style={styles.resend}
      >
        Resend OTP
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  title: { fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#757575', marginBottom: 8, lineHeight: 24 },
  mobile: { fontWeight: 'bold', color: '#212121' },
  hint: { textAlign: 'center', color: '#757575' },
  resend: { marginTop: 8 },
});
