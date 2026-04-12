import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { formatCoins } from '../utils/format';

type Props = {
  balance: number;
  loading?: boolean;
};

export function CoinCard({ balance, loading }: Props) {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.content}>
        <Text variant="labelLarge" style={styles.label}>Your Coin Balance</Text>
        <Text variant="displaySmall" style={styles.balance}>
          {loading ? '...' : formatCoins(balance)}
        </Text>
        <Text variant="bodySmall" style={styles.hint}>
          Use coins on your next purchase
        </Text>
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
  label: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balance: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  hint: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
});
