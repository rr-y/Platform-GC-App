import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text, Divider, Chip, ActivityIndicator, Icon } from 'react-native-paper';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { CoinCard } from '../../src/components/CoinCard';
import { ExpiryBanner } from '../../src/components/ExpiryBanner';
import { SkeletonBox } from '../../src/components/SkeletonBox';
import { getCoinBalance, getCoinHistory } from '../../src/api/coins';
import { formatDate } from '../../src/utils/format';

const TYPE_COLORS: Record<string, string> = {
  earned: '#e8f5e9',
  redeemed: '#fce4ec',
  expired: '#eeeeee',
  adjusted: '#e3f2fd',
};
const TYPE_TEXT: Record<string, string> = {
  earned: '#2e7d32',
  redeemed: '#c62828',
  expired: '#757575',
  adjusted: '#1565c0',
};
const TYPE_ICONS: Record<string, string> = {
  earned: 'arrow-up-circle',
  redeemed: 'arrow-down-circle',
  expired: 'clock-outline',
  adjusted: 'pencil-circle',
};

function SkeletonHistoryRow() {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SkeletonBox width={28} height={28} borderRadius={14} />
          <SkeletonBox width={64} height={20} borderRadius={10} />
        </View>
        <SkeletonBox width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      <SkeletonBox width={40} height={20} borderRadius={4} />
    </View>
  );
}

export default function CoinsScreen() {
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ['coinBalance'],
    queryFn: getCoinBalance,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch: refetchHistory } = useInfiniteQuery({
    queryKey: ['coinHistory'],
    queryFn: ({ pageParam = 1 }) => getCoinHistory(pageParam, 20),
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
    initialPageParam: 1,
  });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBalance(), refetchHistory()]);
    setRefreshing(false);
  };

  return (
    <FlatList
      refreshing={refreshing}
      onRefresh={onRefresh}
      style={styles.container}
      ListHeaderComponent={
        <>
          <CoinCard balance={balance?.total_active_coins ?? 0} loading={balanceLoading} />
          {balance?.expiring_soon && (
            <ExpiryBanner
              coins={balance.expiring_soon.coins}
              expiryAt={balance.expiring_soon.expiry_at}
            />
          )}
          <Text variant="titleMedium" style={styles.historyTitle}>Coin History</Text>
          <Divider />
          {isLoading && (
            <>
              {[...Array(6)].map((_, i) => (
                <View key={i}>
                  <SkeletonHistoryRow />
                  <Divider />
                </View>
              ))}
            </>
          )}
        </>
      }
      data={allItems}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const iconName = TYPE_ICONS[item.type] ?? 'circle-outline';
        const iconColor = TYPE_TEXT[item.type] ?? '#212121';
        return (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.typeRow}>
                <Icon source={iconName} size={22} color={iconColor} />
                <Chip
                  compact
                  textStyle={{ color: iconColor, fontSize: 11 }}
                  style={{ backgroundColor: TYPE_COLORS[item.type] ?? '#f5f5f5' }}
                >
                  {item.type}
                </Chip>
              </View>
              <Text variant="bodySmall" style={styles.date}>{formatDate(item.issued_at)}</Text>
            </View>
            <Text
              variant="titleMedium"
              style={{ color: item.coins >= 0 ? '#2e7d32' : '#c62828', fontWeight: 'bold' }}
            >
              {item.coins >= 0 ? '+' : ''}{item.coins}
            </Text>
          </View>
        );
      }}
      ItemSeparatorComponent={() => <Divider />}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.3}
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.loader} /> : null}
      ListEmptyComponent={
        !isLoading ? <Text style={styles.empty}>No coin history yet.</Text> : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  historyTitle: { padding: 16, fontWeight: 'bold', backgroundColor: '#fff' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  rowLeft: { gap: 4 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { color: '#9e9e9e' },
  loader: { padding: 24 },
  empty: { padding: 24, color: '#9e9e9e', textAlign: 'center' },
});
