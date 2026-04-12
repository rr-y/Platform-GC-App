import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Divider, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { CoinCard } from '../../src/components/CoinCard';
import { ExpiryBanner } from '../../src/components/ExpiryBanner';
import { TransactionItem } from '../../src/components/TransactionItem';
import { getCoinBalance } from '../../src/api/coins';
import { getMyTransactions } from '../../src/api/transactions';
import { useAuthStore } from '../../src/store/auth';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['coinBalance'],
    queryFn: getCoinBalance,
  });

  const { data: txns, isLoading: txnLoading } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: () => getMyTransactions(1, 3),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {user?.name && (
        <Text variant="titleMedium" style={styles.greeting}>
          Hi, {user.name} 👋
        </Text>
      )}

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
          <ActivityIndicator style={styles.loader} />
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
  greeting: { margin: 16, marginBottom: 0, color: '#424242' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 8, overflow: 'hidden' },
  sectionTitle: { padding: 16, fontWeight: 'bold' },
  loader: { padding: 24 },
  empty: { padding: 16, color: '#9e9e9e', textAlign: 'center' },
});
