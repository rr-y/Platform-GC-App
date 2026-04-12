import React from 'react';
import { StyleSheet } from 'react-native';
import { Banner } from 'react-native-paper';
import { formatDate, daysUntil } from '../utils/format';

type Props = {
  coins: number;
  expiryAt: string;
  onDismiss?: () => void;
};

export function ExpiryBanner({ coins, expiryAt, onDismiss }: Props) {
  const days = daysUntil(expiryAt);
  return (
    <Banner
      visible
      actions={onDismiss ? [{ label: 'Dismiss', onPress: onDismiss }] : []}
      icon="alert-circle-outline"
      style={styles.banner}
    >
      {`⚠️ ${coins} coins expire in ${days} day${days !== 1 ? 's' : ''} (${formatDate(expiryAt)}). Use them before they're gone!`}
    </Banner>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fff3e0',
  },
});
