import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listPrintJobs, type PrintJob } from '../../../src/api/print';

const STATUS_COPY: Record<PrintJob['status'], { label: string; color: string }> = {
  draft: { label: 'Not submitted', color: '#9e9e9e' },
  queued: { label: 'Queued', color: '#1976d2' },
  printing: { label: 'Printing', color: '#f57c00' },
  printed: { label: 'Ready for pickup', color: '#2e7d32' },
  collected: { label: 'Collected', color: '#616161' },
  cancelled: { label: 'Cancelled', color: '#c62828' },
};

export default function PrintHomeScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['printJobs'],
    queryFn: listPrintJobs,
  });

  const jobs = (data ?? []).filter((j) => j.status !== 'draft');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ee']} tintColor="#6200ee" />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Print Store</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Upload a PDF or image, pick the pages, and collect your printout at the counter using your pickup OTP.
        </Text>
      </View>

      <Button
        mode="contained"
        icon="file-upload"
        onPress={() => router.push('/(tabs)/print/new')}
        style={styles.primaryBtn}
        contentStyle={{ paddingVertical: 6 }}
      >
        New print job
      </Button>

      <Text variant="labelMedium" style={styles.sectionLabel}>MY PRINT JOBS</Text>

      {isLoading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : jobs.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="printer-outline" size={48} color="#bdbdbd" />
          <Text style={styles.empty}>No print jobs yet.</Text>
        </View>
      ) : (
        jobs.map((job) => {
          const s = STATUS_COPY[job.status];
          return (
            <Card
              key={job.id}
              style={styles.card}
              elevation={1}
              onPress={() => router.push({ pathname: '/(tabs)/print/[id]', params: { id: job.id } })}
            >
              <Card.Content>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" numberOfLines={1} style={styles.fileName}>
                      {job.file_name}
                    </Text>
                    <Text variant="bodySmall" style={styles.meta}>
                      {job.copies ?? 1} {(job.copies ?? 1) === 1 ? 'copy' : 'copies'}
                      {' · '}
                      {job.color_mode === 'color' ? 'Color' : 'B&W'}
                      {job.final_amount != null ? ` · ₹${job.final_amount.toFixed(2)}` : ''}
                    </Text>
                  </View>
                  <Chip
                    compact
                    style={{ backgroundColor: s.color + '22' }}
                    textStyle={{ color: s.color, fontWeight: '600' }}
                  >
                    {s.label}
                  </Chip>
                </View>
                {job.pickup_otp && (job.status === 'queued' || job.status === 'printing' || job.status === 'printed') && (
                  <>
                    <Divider style={{ marginVertical: 10 }} />
                    <View style={styles.row}>
                      <Text variant="bodySmall" style={styles.otpLabel}>PICKUP OTP</Text>
                      <Text variant="titleLarge" style={styles.otpValue}>{job.pickup_otp}</Text>
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  title: { fontWeight: 'bold', color: '#212121' },
  subtitle: { color: '#757575', marginTop: 4 },
  primaryBtn: { marginBottom: 24 },
  sectionLabel: { color: '#9e9e9e', letterSpacing: 0.8, marginBottom: 8 },
  card: { marginBottom: 10, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fileName: { fontWeight: 'bold', color: '#212121' },
  meta: { color: '#757575', marginTop: 2 },
  otpLabel: { color: '#9e9e9e', letterSpacing: 1 },
  otpValue: { fontWeight: 'bold', color: '#6200ee', letterSpacing: 4 },
  empty: { color: '#9e9e9e', textAlign: 'center', marginTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
});
