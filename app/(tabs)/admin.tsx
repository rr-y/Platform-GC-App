import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  Divider,
  HelperText,
  Text,
  TextInput,
} from 'react-native-paper';
import { useMutation } from '@tanstack/react-query';
import { adminCheckout, lookupCustomer } from '../../src/api/admin';
import type { CheckoutResult, CustomerLookup } from '../../src/api/admin';

type Phase = 'lookup' | 'confirm' | 'receipt';

export default function AdminCheckoutScreen() {
  // ── Phase 1 state ──────────────────────────────────────────────────────────
  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState('');

  // ── Phase 2 state ──────────────────────────────────────────────────────────
  const [customer, setCustomer] = useState<CustomerLookup | null>(null);
  const [coinsToRedeem, setCoinsToRedeem] = useState('');
  const [couponCode, setCouponCode] = useState('');

  // ── Phase 3 state ──────────────────────────────────────────────────────────
  const [receipt, setReceipt] = useState<CheckoutResult | null>(null);

  const [phase, setPhase] = useState<Phase>('lookup');
  const [error, setError] = useState('');

  // ── Lookup mutation ────────────────────────────────────────────────────────
  const lookup = useMutation({
    mutationFn: () => lookupCustomer(mobile.trim(), parseFloat(amount)),
    onSuccess: (data) => {
      setCustomer(data);
      setCoinsToRedeem('');
      setCouponCode('');
      setError('');
      setPhase('confirm');
    },
    onError: (e: any) => {
      setError(e?.response?.data?.detail ?? 'Customer not found.');
    },
  });

  // ── Checkout mutation ──────────────────────────────────────────────────────
  const checkout = useMutation({
    mutationFn: () =>
      adminCheckout({
        mobile_number: mobile.trim(),
        amount: parseFloat(amount),
        coins_to_redeem: coinsToRedeem ? parseInt(coinsToRedeem, 10) : 0,
        coupon_code: couponCode.trim() || undefined,
      }),
    onSuccess: (data) => {
      setReceipt(data);
      setError('');
      setPhase('receipt');
    },
    onError: (e: any) => {
      setError(e?.response?.data?.detail ?? 'Payment failed. Please try again.');
    },
  });

  const handleReset = () => {
    setMobile('');
    setAmount('');
    setCustomer(null);
    setCoinsToRedeem('');
    setCouponCode('');
    setReceipt(null);
    setError('');
    setPhase('lookup');
  };

  // ── Phase 1 — Lookup ───────────────────────────────────────────────────────
  if (phase === 'lookup') {
    return (
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.heading}>New Payment</Text>
        <Text variant="bodyMedium" style={styles.sub}>
          Enter the customer's mobile number and bill amount to check their coins and offers.
        </Text>

        <TextInput
          label="Customer Mobile"
          value={mobile}
          onChangeText={(t) => { setMobile(t); setError(''); }}
          mode="outlined"
          keyboardType="phone-pad"
          placeholder="+91 98765 43210"
          style={styles.input}
          left={<TextInput.Icon icon="phone" />}
        />
        <TextInput
          label="Bill Amount (₹)"
          value={amount}
          onChangeText={(t) => { setAmount(t); setError(''); }}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
          left={<TextInput.Icon icon="currency-inr" />}
        />

        {!!error && <HelperText type="error" visible>{error}</HelperText>}

        <Button
          mode="contained"
          onPress={() => lookup.mutate()}
          loading={lookup.isPending}
          disabled={lookup.isPending || !mobile.trim() || !amount.trim()}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="account-search"
        >
          Check Customer
        </Button>
      </ScrollView>
    );
  }

  // ── Phase 2 — Confirm ──────────────────────────────────────────────────────
  if (phase === 'confirm' && customer) {
    const maxCoins = customer.max_redeemable_coins;
    const parsedCoins = parseInt(coinsToRedeem, 10) || 0;
    const coinValue = (parsedCoins * 0.10).toFixed(2);

    return (
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.heading}>Confirm Payment</Text>

        {/* Customer card */}
        <Card style={styles.card} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardName}>
              {customer.name ?? customer.mobile_number}
            </Text>
            {customer.name && (
              <Text variant="bodySmall" style={styles.cardMobile}>{customer.mobile_number}</Text>
            )}
            <Divider style={styles.divider} />
            <View style={styles.balanceRow}>
              <View style={styles.balanceStat}>
                <Text variant="labelSmall" style={styles.statLabel}>COIN BALANCE</Text>
                <Text variant="titleLarge" style={styles.statValue}>{customer.coin_balance}</Text>
              </View>
              <View style={styles.balanceStat}>
                <Text variant="labelSmall" style={styles.statLabel}>MAX REDEEMABLE</Text>
                <Text variant="titleLarge" style={styles.statValue}>{maxCoins}</Text>
                <Text variant="bodySmall" style={styles.statSub}>= ₹{customer.max_redeemable_value.toFixed(2)}</Text>
              </View>
              <View style={styles.balanceStat}>
                <Text variant="labelSmall" style={styles.statLabel}>BILL AMOUNT</Text>
                <Text variant="titleLarge" style={styles.statValue}>₹{parseFloat(amount).toFixed(0)}</Text>
              </View>
            </View>

            {customer.expiring_soon && (
              <View style={styles.expiryBanner}>
                <Text variant="bodySmall" style={styles.expiryText}>
                  ⚠ {customer.expiring_soon.coins} coins expiring soon — encourage redemption!
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Available offers */}
        {customer.applicable_offers.length > 0 && (
          <View style={styles.offersSection}>
            <Text variant="labelMedium" style={styles.sectionLabel}>AVAILABLE OFFERS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.offerChips}>
                {customer.applicable_offers.map((o) => (
                  <Chip
                    key={o.coupon_id}
                    mode={couponCode === o.code ? 'flat' : 'outlined'}
                    selected={couponCode === o.code}
                    onPress={() => setCouponCode(couponCode === o.code ? '' : o.code)}
                    style={styles.offerChip}
                  >
                    {o.code} — {o.discount_type === 'flat'
                      ? `₹${o.discount_value} off`
                      : `${o.discount_value}% off`}
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Coin redemption */}
        {maxCoins > 0 && (
          <TextInput
            label={`Coins to Redeem (max ${maxCoins})`}
            value={coinsToRedeem}
            onChangeText={(t) => { setCoinsToRedeem(t); setError(''); }}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.input}
            left={<TextInput.Icon icon="hand-coin" />}
            right={
              parsedCoins > 0
                ? <TextInput.Affix text={`= ₹${coinValue} off`} />
                : undefined
            }
            error={parsedCoins > maxCoins}
          />
        )}
        {parsedCoins > maxCoins && (
          <HelperText type="error" visible>Cannot redeem more than {maxCoins} coins.</HelperText>
        )}

        {/* Manual coupon entry */}
        <TextInput
          label="Coupon Code (optional)"
          value={couponCode}
          onChangeText={(t) => { setCouponCode(t.toUpperCase()); setError(''); }}
          mode="outlined"
          autoCapitalize="characters"
          style={styles.input}
          left={<TextInput.Icon icon="ticket-percent" />}
        />

        {!!error && <HelperText type="error" visible>{error}</HelperText>}

        <Button
          mode="contained"
          onPress={() => checkout.mutate()}
          loading={checkout.isPending}
          disabled={checkout.isPending || parsedCoins > maxCoins}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="check-circle"
        >
          Confirm Payment
        </Button>
        <Button
          mode="text"
          onPress={handleReset}
          disabled={checkout.isPending}
          style={{ marginTop: 4 }}
        >
          Cancel
        </Button>
      </ScrollView>
    );
  }

  // ── Phase 3 — Receipt ──────────────────────────────────────────────────────
  if (phase === 'receipt' && receipt) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>✓</Text>
        </View>
        <Text variant="headlineSmall" style={[styles.heading, { textAlign: 'center' }]}>
          Payment Confirmed
        </Text>
        {receipt.notification_sent && (
          <Text variant="bodySmall" style={styles.notifSent}>
            WhatsApp/SMS sent to customer
          </Text>
        )}

        <Card style={styles.card} elevation={2}>
          <Card.Content>
            <Row label="Bill Amount" value={`₹${receipt.amount.toFixed(2)}`} />
            {receipt.discount_applied > 0 && (
              <Row label="Coupon Discount" value={`−₹${receipt.discount_applied.toFixed(2)}`} highlight />
            )}
            {receipt.coins_redeemed > 0 && (
              <Row
                label={`Coins Redeemed (${receipt.coins_redeemed})`}
                value={`−₹${receipt.coins_redeemed_value.toFixed(2)}`}
                highlight
              />
            )}
            <Divider style={styles.divider} />
            <Row label="Final Amount" value={`₹${receipt.final_amount.toFixed(2)}`} bold />
            <Divider style={styles.divider} />
            {receipt.coins_earned > 0 && (
              <Row label="Coins Earned" value={`+${receipt.coins_earned}`} highlight />
            )}
            <Row label="New Coin Balance" value={`${receipt.coins_balance_after} coins`} />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleReset}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="plus"
        >
          New Payment
        </Button>
      </ScrollView>
    );
  }

  return null;
}

function Row({
  label,
  value,
  highlight,
  bold,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={styles.receiptRow}>
      <Text variant="bodyMedium" style={bold ? styles.boldText : styles.receiptLabel}>
        {label}
      </Text>
      <Text
        variant="bodyMedium"
        style={[bold ? styles.boldText : undefined, highlight ? styles.highlightText : undefined]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  heading: { fontWeight: 'bold', color: '#212121', marginBottom: 6 },
  sub: { color: '#757575', marginBottom: 24 },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
  buttonContent: { paddingVertical: 6 },
  card: { marginBottom: 16, borderRadius: 12 },
  cardName: { fontWeight: 'bold', color: '#212121' },
  cardMobile: { color: '#757575', marginTop: 2 },
  divider: { marginVertical: 12 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceStat: { alignItems: 'center', flex: 1 },
  statLabel: { color: '#9e9e9e', letterSpacing: 0.5, marginBottom: 2 },
  statValue: { fontWeight: 'bold', color: '#212121' },
  statSub: { color: '#6200ee', marginTop: 2 },
  expiryBanner: {
    marginTop: 12,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 10,
  },
  expiryText: { color: '#f57f17' },
  offersSection: { marginBottom: 12 },
  sectionLabel: { color: '#9e9e9e', letterSpacing: 0.8, marginBottom: 8 },
  offerChips: { flexDirection: 'row', gap: 8 },
  offerChip: { marginRight: 4 },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  successEmoji: { fontSize: 32, color: '#2e7d32' },
  notifSent: { color: '#388e3c', textAlign: 'center', marginBottom: 16 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  receiptLabel: { color: '#616161' },
  boldText: { fontWeight: 'bold', color: '#212121' },
  highlightText: { color: '#6200ee' },
});
