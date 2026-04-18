import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { CoinCard } from '../../src/components/CoinCard';
import { ExpiryBanner } from '../../src/components/ExpiryBanner';
import { TransactionItem } from '../../src/components/TransactionItem';
import { SkeletonBox } from '../../src/components/SkeletonBox';
import { OfferBannerCarousel } from '../../src/components/OfferBannerCarousel';
import { getCoinBalance } from '../../src/api/coins';
import { getMyTransactions } from '../../src/api/transactions';
import { getOfferBanners } from '../../src/api/offers';
import { useAuthStore } from '../../src/store/auth';

function SkeletonTransactionRow() {
  return (
    <View style={styles.skeletonRow}>
      <View>
        <SkeletonBox width={120} height={14} borderRadius={4} />
        <SkeletonBox width={80} height={11} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <SkeletonBox width={48} height={22} borderRadius={10} />
    </View>
  );
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ['coinBalance'],
    queryFn: getCoinBalance,
  });

  const { data: txns, isLoading: txnLoading, refetch: refetchTxns } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: () => getMyTransactions(1, 3),
  });

  const { data: banners, isLoading: bannersLoading, refetch: refetchBanners } = useQuery({
    queryKey: ['offerBanners'],
    queryFn: getOfferBanners,
    staleTime: 5 * 60 * 1000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBalance(), refetchTxns(), refetchBanners()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} tintColor="#6200ee" />}
    >
      {user?.name && (
        <Text variant="titleMedium" style={styles.greeting}>
          Hi, {user.name} 👋
        </Text>
      )}

      <OfferBannerCarousel data={banners ?? []} loading={bannersLoading} />

      <CoinCard balance={balance?.total_active_coins ?? 0} loading={balanceLoading} />

      {balance?.expiring_soon && (
        <ExpiryBanner
          coins={balance.expiring_soon.coins}
          expiryAt={balance.expiring_soon.expiry_at}
        />
      )}

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Recent Transactions</Text>
        <Divider />
        {txnLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <View key={i}>
                <SkeletonTransactionRow />
                {i < 2 && <Divider />}
              </View>
            ))}
          </>
        ) : txns?.items.length === 0 ? (
          <Text style={styles.empty}>No transactions yet.</Text>
        ) : (
          txns?.items.map((item) => <TransactionItem key={item.id} item={item} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 32 },
  greeting: { marginHorizontal: 16, marginTop: 16, marginBottom: 12, color: '#424242' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 8, overflow: 'hidden' },
  sectionTitle: { padding: 16, fontWeight: 'bold' },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  empty: { padding: 16, color: '#9e9e9e', textAlign: 'center' },
});
