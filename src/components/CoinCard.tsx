import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import { formatCoins } from '../utils/format';
import { SkeletonBox } from './SkeletonBox';

type Props = {
  balance: number;
  loading?: boolean;
};

export function CoinCard({ balance, loading }: Props) {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.content}>
        {loading ? (
          <>
            <SkeletonBox width={140} height={14} borderRadius={4} color="rgba(255,255,255,0.3)" style={styles.skeletonLabel} />
            <SkeletonBox width={100} height={44} borderRadius={6} color="rgba(255,255,255,0.3)" style={styles.skeletonBalance} />
            <SkeletonBox width={180} height={12} borderRadius={4} color="rgba(255,255,255,0.3)" style={styles.skeletonHint} />
          </>
        ) : (
          <>
            <View style={styles.labelRow}>
              <Icon source="wallet" size={16} color="rgba(255,255,255,0.8)" />
              <Text variant="labelLarge" style={styles.label}>Your Coin Balance</Text>
            </View>
            <Text variant="displaySmall" style={styles.balance}>
              {formatCoins(balance)}
            </Text>
            <Text variant="bodySmall" style={styles.hint}>
              Use coins on your next purchase
            </Text>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    backgroundColor: '#6200ee',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
  },
  balance: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  hint: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  skeletonLabel: { marginBottom: 12 },
  skeletonBalance: { marginBottom: 12 },
  skeletonHint: {},
});
