import React from 'react';
import { StyleSheet, View } from 'react-native';
import { List, Text, Chip } from 'react-native-paper';
import { formatCurrency, formatDateTime } from '../utils/format';
import type { TransactionItem as TxType } from '../api/transactions';

type Props = { item: TxType };

export function TransactionItem({ item }: Props) {
  return (
    <List.Item
      title={formatCurrency(item.amount)}
      description={formatDateTime(item.created_at)}
      right={() => (
        <View style={styles.right}>
          {item.coins_earned > 0 && (
            <Chip compact textStyle={styles.earnText} style={styles.earnChip}>
              +{item.coins_earned}
            </Chip>
          )}
          {item.coins_used > 0 && (
            <Chip compact textStyle={styles.redeemText} style={styles.redeemChip}>
              -{item.coins_used}
            </Chip>
          )}
        </View>
      )}
      style={styles.item}
    />
  );
}

const styles = StyleSheet.create({
  item: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e0' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  earnChip: { backgroundColor: '#e8f5e9' },
  earnText: { color: '#2e7d32', fontSize: 12 },
  redeemChip: { backgroundColor: '#fce4ec' },
  redeemText: { color: '#c62828', fontSize: 12 },
});
