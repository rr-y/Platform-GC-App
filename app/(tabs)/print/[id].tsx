import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Divider, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelPrintJob, getPrintJob, type PrintJob } from '../../../src/api/print';
import { getApiError } from '../../../src/utils/errors';

const STATUS_COPY: Record<PrintJob['status'], { label: string; color: string; hint: string }> = {
  draft: { label: 'Draft', color: '#9e9e9e', hint: '' },
  queued: {
    label: 'Queued',
    color: '#1976d2',
    hint: 'Your file is in the print queue. The printer picks up jobs every hour.',
  },
  printing: {
    label: 'Printing',
    color: '#f57c00',
    hint: 'The printer is working on your job right now.',
  },
  printed: {
    label: 'Ready for pickup',
    color: '#2e7d32',
    hint: 'Show the pickup OTP at the counter to collect your printout.',
  },
  collected: {
    label: 'Collected',
    color: '#616161',
    hint: 'This job was handed over and paid for.',
  },
  cancelled: { label: 'Cancelled', color: '#c62828', hint: '' },
};

export default function PrintJobDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: job, isLoading, refetch } = useQuery({
    queryKey: ['printJob', id],
    queryFn: () => getPrintJob(id!),
    enabled: !!id,
    // Poll while the job is still in flight so users see live status.
    refetchInterval: (query) => {
      const d = query.state.data as PrintJob | undefined;
      if (!d) return 10_000;
      return ['queued', 'printing'].includes(d.status) ? 15_000 : false;
    },
  });

  const cancel = useMutation({
    mutationFn: () => cancelPrintJob(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printJobs'] });
      refetch();
    },
    onError: (e: any) => {
      Alert.alert('Cancel failed', getApiError(e, 'Could not cancel this job.'));
    },
  });

  if (isLoading || !job) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  const s = STATUS_COPY[job.status];
  const canCancel = job.status === 'queued';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.statusCard} elevation={2}>
        <Card.Content style={{ alignItems: 'center' }}>
          <MaterialCommunityIcons
            name={job.status === 'printed' ? 'check-circle' : job.status === 'cancelled' ? 'close-circle' : 'printer'}
            size={56}
            color={s.color}
          />
          <Text variant="titleLarge" style={[styles.statusLabel, { color: s.color }]}>
            {s.label}
          </Text>
          {!!s.hint && <Text variant="bodyMedium" style={styles.statusHint}>{s.hint}</Text>}
        </Card.Content>
      </Card>

      {job.pickup_otp && ['queued', 'printing', 'printed'].includes(job.status) && (
        <Card style={styles.otpCard} elevation={3}>
          <Card.Content style={{ alignItems: 'center' }}>
            <Text variant="labelMedium" style={styles.otpLabel}>PICKUP OTP</Text>
            <Text variant="displayMedium" style={styles.otpValue}>{job.pickup_otp}</Text>
            <Text variant="bodySmall" style={styles.otpHint}>
              Show this 4-digit code at the counter along with ₹{(job.final_amount ?? 0).toFixed(2)} in cash.
            </Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="labelMedium" style={styles.sectionLabel}>FILE</Text>
          <Text variant="titleSmall" numberOfLines={1} style={styles.fileName}>{job.file_name}</Text>
          <Text variant="bodySmall" style={styles.meta}>
            {job.page_count} {job.page_count === 1 ? 'page' : 'pages'} uploaded
          </Text>

          <Divider style={styles.divider} />

          <Text variant="labelMedium" style={styles.sectionLabel}>JOB</Text>
          <Row
            label="Pages to print"
            value={
              job.selected_pages && job.selected_pages.length
                ? compressRanges(job.selected_pages)
                : '—'
            }
          />
          <Row label="Copies" value={String(job.copies ?? 1)} />
          <Row label="Color mode" value={job.color_mode === 'color' ? 'Color' : 'Black & white'} />

          <Divider style={styles.divider} />

          <Text variant="labelMedium" style={styles.sectionLabel}>PAYMENT</Text>
          {job.subtotal != null && (
            <Row label="Subtotal" value={`₹${job.subtotal.toFixed(2)}`} />
          )}
          {job.coins_to_redeem > 0 && (
            <Row
              label={`Coins redeemed (${job.coins_to_redeem})`}
              value={`−₹${job.coin_value.toFixed(2)}`}
              highlight
            />
          )}
          {job.final_amount != null && (
            <Row label="Pay at counter" value={`₹${job.final_amount.toFixed(2)}`} bold />
          )}
        </Card.Content>
      </Card>

      {canCancel && (
        <Button
          mode="outlined"
          onPress={() =>
            Alert.alert('Cancel print job?', 'The file will be deleted and no charge will apply.', [
              { text: 'Keep', style: 'cancel' },
              { text: 'Cancel job', style: 'destructive', onPress: () => cancel.mutate() },
            ])
          }
          loading={cancel.isPending}
          disabled={cancel.isPending}
          textColor="#c62828"
          style={styles.cancelBtn}
        >
          Cancel job
        </Button>
      )}

      <Button mode="text" onPress={() => router.replace('/(tabs)/print')}>
        Back to print jobs
      </Button>
    </ScrollView>
  );
}

function Row({ label, value, highlight, bold }: {
  label: string; value: string; highlight?: boolean; bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text variant="bodyMedium" style={bold ? styles.bold : styles.rowLabel}>{label}</Text>
      <Text variant="bodyMedium" style={[bold && styles.bold, highlight && styles.highlight]}>{value}</Text>
    </View>
  );
}

function compressRanges(pages: number[]): string {
  if (!pages.length) return '—';
  const sorted = [...pages].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = prev = sorted[i];
  }
  parts.push(start === prev ? `${start}` : `${start}–${prev}`);
  return parts.join(', ');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusCard: { borderRadius: 12, marginBottom: 12 },
  statusLabel: { fontWeight: 'bold', marginTop: 8 },
  statusHint: { color: '#616161', marginTop: 6, textAlign: 'center' },
  otpCard: { borderRadius: 12, marginBottom: 12, backgroundColor: '#f3e5f5' },
  otpLabel: { color: '#6200ee', letterSpacing: 1.2 },
  otpValue: { fontWeight: 'bold', color: '#6200ee', letterSpacing: 10, marginVertical: 4 },
  otpHint: { color: '#616161', textAlign: 'center', marginTop: 4 },
  card: { borderRadius: 12, marginBottom: 12 },
  fileName: { fontWeight: 'bold', color: '#212121', marginTop: 4 },
  meta: { color: '#757575', marginTop: 2 },
  sectionLabel: { color: '#9e9e9e', letterSpacing: 0.8, marginBottom: 6 },
  divider: { marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  rowLabel: { color: '#616161' },
  bold: { fontWeight: 'bold', color: '#212121' },
  highlight: { color: '#6200ee' },
  cancelBtn: { marginTop: 8, borderColor: '#c62828' },
});
