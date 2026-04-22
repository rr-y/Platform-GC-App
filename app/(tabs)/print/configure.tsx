import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  HelperText,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  estimatePrint,
  submitPrintJob,
  type PrintPriceBreakdown,
} from '../../../src/api/print';
import { getCoinBalance } from '../../../src/api/coins';
import { getApiError } from '../../../src/utils/errors';

export default function ConfigureScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    uploadId: string;
    fileName: string;
    mimeType: string;
    pageCount: string;
  }>();

  const pageCount = parseInt(params.pageCount ?? '1', 10);
  const isImage = params.mimeType !== 'application/pdf';

  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(Array.from({ length: pageCount }, (_, i) => i + 1)),
  );
  const [colorMode, setColorMode] = useState<'bw' | 'color'>('bw');
  const [copies, setCopies] = useState('1');
  const [coinsInput, setCoinsInput] = useState('0');
  const [breakdown, setBreakdown] = useState<PrintPriceBreakdown | null>(null);
  const [error, setError] = useState('');

  const { data: balance } = useQuery({
    queryKey: ['coinBalance'],
    queryFn: getCoinBalance,
  });

  const selectedPages = useMemo(
    () => Array.from(selected).sort((a, b) => a - b),
    [selected],
  );

  const copiesNum = Math.max(1, parseInt(copies, 10) || 0);
  const coinsNum = Math.max(0, parseInt(coinsInput, 10) || 0);

  const estimate = useMutation({
    mutationFn: () =>
      estimatePrint({
        page_count: pageCount,
        selected_pages: selectedPages,
        color_mode: colorMode,
        copies: copiesNum,
        coins_to_redeem: coinsNum,
      }),
    onSuccess: (data) => {
      setBreakdown(data);
      setError('');
    },
    onError: (e: any) => {
      setBreakdown(null);
      setError(getApiError(e, 'Could not calculate price.'));
    },
  });

  const submit = useMutation({
    mutationFn: () =>
      submitPrintJob({
        upload_id: params.uploadId!,
        selected_pages: selectedPages,
        color_mode: colorMode,
        copies: copiesNum,
        coins_to_redeem: coinsNum,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['printJobs'] });
      queryClient.invalidateQueries({ queryKey: ['coinBalance'] });
      router.replace({ pathname: '/(tabs)/print/[id]', params: { id: data.job.id } });
    },
    onError: (e: any) => {
      setError(getApiError(e, 'Could not submit job.'));
    },
  });

  // Recompute price whenever inputs change
  useEffect(() => {
    if (selectedPages.length === 0 || copiesNum < 1) {
      setBreakdown(null);
      return;
    }
    const t = setTimeout(() => estimate.mutate(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPages.join(','), colorMode, copiesNum, coinsNum]);

  const togglePage = (n: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const selectAll = () =>
    setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
  const clearAll = () => setSelected(new Set());

  const canSubmit = selectedPages.length > 0 && copiesNum >= 1 && !submit.isPending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodySmall" style={styles.label}>FILE</Text>
          <Text variant="titleSmall" numberOfLines={1} style={styles.fileName}>
            {params.fileName}
          </Text>
          <Text variant="bodySmall" style={styles.meta}>
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </Text>
        </Card.Content>
      </Card>

      {!isImage && (
        <>
          <View style={styles.sectionHeader}>
            <Text variant="labelMedium" style={styles.sectionLabel}>PAGES TO PRINT</Text>
            <View style={styles.sectionActions}>
              <Button mode="text" compact onPress={selectAll} disabled={selected.size === pageCount}>All</Button>
              <Button mode="text" compact onPress={clearAll} disabled={selected.size === 0}>None</Button>
            </View>
          </View>
          <View style={styles.pageGrid}>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
              const isSelected = selected.has(n);
              return (
                <Pressable key={n} onPress={() => togglePage(n)} style={[styles.pageChip, isSelected && styles.pageChipOn]}>
                  <Text style={[styles.pageChipText, isSelected && styles.pageChipTextOn]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
          <HelperText type="info" visible>
            {selectedPages.length} of {pageCount} pages selected
          </HelperText>
        </>
      )}

      <Text variant="labelMedium" style={styles.sectionLabel}>COLOR</Text>
      <SegmentedButtons
        value={colorMode}
        onValueChange={(v) => setColorMode(v as 'bw' | 'color')}
        buttons={[
          { value: 'bw', label: 'B & W', icon: 'contrast-circle' },
          { value: 'color', label: 'Color', icon: 'palette' },
        ]}
        style={styles.segmented}
      />

      <Text variant="labelMedium" style={styles.sectionLabel}>COPIES</Text>
      <TextInput
        mode="outlined"
        value={copies}
        onChangeText={setCopies}
        keyboardType="number-pad"
        style={styles.input}
        left={<TextInput.Icon icon="content-copy" />}
      />

      <Text variant="labelMedium" style={styles.sectionLabel}>REDEEM COINS</Text>
      <TextInput
        mode="outlined"
        value={coinsInput}
        onChangeText={setCoinsInput}
        keyboardType="number-pad"
        style={styles.input}
        left={<TextInput.Icon icon="hand-coin" />}
        right={<TextInput.Affix text={`bal ${balance?.total_active_coins ?? 0}`} />}
      />
      <HelperText type="info" visible>
        Up to 20% of the bill can be paid with coins. We'll cap automatically.
      </HelperText>

      <Card style={[styles.card, styles.summaryCard]} elevation={2}>
        <Card.Content>
          <Text variant="labelMedium" style={styles.sectionLabel}>BILL PREVIEW</Text>
          {estimate.isPending ? (
            <View style={styles.estimating}>
              <ActivityIndicator size="small" color="#6200ee" />
              <Text variant="bodySmall" style={styles.estimatingText}>Calculating…</Text>
            </View>
          ) : breakdown ? (
            <>
              <Row
                label={`${breakdown.pages_to_print} ${breakdown.pages_to_print === 1 ? 'page' : 'pages'} × ${breakdown.copies} ${breakdown.copies === 1 ? 'copy' : 'copies'}`}
                value={`${breakdown.pages_to_print * breakdown.copies} printouts`}
                muted
              />
              <Row
                label={`Rate (${breakdown.color_mode === 'color' ? 'Color' : 'B & W'})`}
                value={`₹${breakdown.rate_per_page.toFixed(2)} / page`}
                muted
              />
              <Divider style={styles.divider} />
              <Row label="Subtotal" value={`₹${breakdown.subtotal.toFixed(2)}`} />
              {breakdown.coins_to_redeem > 0 && (
                <Row
                  label={`Coins redeemed (${breakdown.coins_to_redeem})`}
                  value={`−₹${breakdown.coin_value.toFixed(2)}`}
                  highlight
                />
              )}
              <Divider style={styles.divider} />
              <Row label="Pay at counter" value={`₹${breakdown.final_amount.toFixed(2)}`} bold />
              {breakdown.coins_to_redeem < coinsNum && (
                <Chip
                  compact
                  style={styles.capChip}
                  textStyle={styles.capChipText}
                  icon="information-outline"
                >
                  Capped at {breakdown.coins_to_redeem} coins (20% / balance limit)
                </Chip>
              )}
            </>
          ) : (
            <Text style={styles.empty}>Select at least one page and one copy to see the price.</Text>
          )}
        </Card.Content>
      </Card>

      {!!error && <HelperText type="error" visible>{error}</HelperText>}

      <Button
        mode="contained"
        icon="check-circle"
        onPress={() => submit.mutate()}
        loading={submit.isPending}
        disabled={!canSubmit || !breakdown}
        style={styles.submitBtn}
        contentStyle={{ paddingVertical: 6 }}
      >
        Submit print job
      </Button>
      <Button mode="text" onPress={() => router.back()} disabled={submit.isPending}>
        Cancel
      </Button>
    </ScrollView>
  );
}

function Row({ label, value, highlight, bold, muted }: {
  label: string; value: string; highlight?: boolean; bold?: boolean; muted?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text variant="bodyMedium" style={[bold && styles.bold, muted && styles.muted]}>{label}</Text>
      <Text variant="bodyMedium" style={[bold && styles.bold, highlight && styles.highlight, muted && styles.muted]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 48 },
  card: { borderRadius: 12, marginBottom: 16 },
  summaryCard: { marginTop: 8 },
  label: { color: '#9e9e9e', letterSpacing: 0.8 },
  fileName: { fontWeight: 'bold', color: '#212121', marginTop: 4 },
  meta: { color: '#757575', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionActions: { flexDirection: 'row', gap: 4 },
  sectionLabel: { color: '#9e9e9e', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  pageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pageChip: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 10,
  },
  pageChipOn: { backgroundColor: '#6200ee', borderColor: '#6200ee' },
  pageChipText: { color: '#616161', fontWeight: '600' },
  pageChipTextOn: { color: '#fff' },
  segmented: { marginBottom: 8 },
  input: { marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  divider: { marginVertical: 8 },
  bold: { fontWeight: 'bold', color: '#212121' },
  highlight: { color: '#6200ee' },
  muted: { color: '#757575' },
  empty: { color: '#9e9e9e', textAlign: 'center', paddingVertical: 12 },
  estimating: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  estimatingText: { color: '#757575' },
  capChip: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#fff8e1' },
  capChipText: { color: '#f57f17' },
  submitBtn: { marginTop: 16 },
});
