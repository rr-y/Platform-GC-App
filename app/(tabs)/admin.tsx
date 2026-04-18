import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  HelperText,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import {
  adminCheckout,
  inviteCustomer,
  lookupCustomer,
  verifyCustomerOtpOnBehalf,
} from '../../src/api/admin';
import type { CheckoutResult, CustomerLookup } from '../../src/api/admin';
import { getCampaigns, toggleCampaign } from '../../src/api/campaigns';
import type { Campaign } from '../../src/api/campaigns';
import { uploadOfferImage } from '../../src/utils/cloudinary';
import { OtpInput } from '../../src/components/OtpInput';

type Phase = 'lookup' | 'invite' | 'confirm' | 'receipt';
type AdminTab = 'checkout' | 'offers';

// FastAPI 422 errors return `detail` as an array of `{type, loc, msg, input}`;
// other errors return it as a string. Coerce to a renderable string.
function getErrorMessage(e: any, fallback: string): string {
  const detail = e?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}

// ══════════════════════════════════════════════════════════════════════════════
// Checkout flow (unchanged)
// ══════════════════════════════════════════════════════════════════════════════

function CheckoutPanel() {
  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState('');
  const [customer, setCustomer] = useState<CustomerLookup | null>(null);
  const [coinsToRedeem, setCoinsToRedeem] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [receipt, setReceipt] = useState<CheckoutResult | null>(null);
  const [phase, setPhase] = useState<Phase>('lookup');
  const [error, setError] = useState('');
  const [canInvite, setCanInvite] = useState(false);

  const lookup = useMutation({
    mutationFn: () => lookupCustomer(mobile.trim(), parseFloat(amount)),
    onSuccess: (data) => {
      setCustomer(data);
      setCoinsToRedeem('');
      setCouponCode('');
      setError('');
      setCanInvite(false);
      setPhase('confirm');
    },
    onError: (e: any) => {
      const notFound = e?.response?.status === 404;
      setError(getErrorMessage(e, 'Customer not found.'));
      setCanInvite(notFound);
    },
  });

  const invite = useMutation({
    mutationFn: () => inviteCustomer(mobile.trim()),
    onError: (e: any) => {
      setError(getErrorMessage(e, 'Could not send OTP. Try again.'));
    },
  });

  const verify = useMutation({
    mutationFn: (otp: string) => verifyCustomerOtpOnBehalf(mobile.trim(), otp),
    onSuccess: () => {
      setError('');
      lookup.mutate();
    },
    onError: (e: any) => {
      setError(getErrorMessage(e, 'Invalid OTP. Ask the customer to check and try again.'));
    },
  });

  const handleStartInvite = () => {
    setError('');
    setPhase('invite');
    invite.mutate();
  };

  const handleResendOtp = () => {
    setError('');
    invite.mutate();
  };

  const handleCancelInvite = () => {
    setError('');
    setCanInvite(false);
    setPhase('lookup');
  };

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
      setError(getErrorMessage(e, 'Payment failed. Please try again.'));
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
    setCanInvite(false);
    setPhase('lookup');
  };

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
          onChangeText={(t) => { setMobile(t); setError(''); setCanInvite(false); }}
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

        {canInvite && (
          <Button
            mode="outlined"
            onPress={handleStartInvite}
            disabled={!mobile.trim()}
            style={styles.inviteButton}
            contentStyle={styles.buttonContent}
            icon="account-plus"
          >
            Invite new customer
          </Button>
        )}
      </ScrollView>
    );
  }

  // ── Phase 1.5 — Invite ─────────────────────────────────────────────────────
  if (phase === 'invite') {
    const sending = invite.isPending;
    const verifying = verify.isPending || lookup.isPending;

    return (
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.heading}>Invite New Customer</Text>
        <Text variant="bodyMedium" style={styles.sub}>
          We sent an OTP to {mobile}. Ask the customer to read the code from their phone.
        </Text>

        {sending ? (
          <View style={styles.inviteSending}>
            <ActivityIndicator size="small" color="#6200ee" />
            <Text variant="bodySmall" style={styles.inviteSendingText}>Sending OTP…</Text>
          </View>
        ) : (
          <>
            <OtpInput onComplete={(otp) => verify.mutate(otp)} />
            {verifying && (
              <View style={styles.inviteSending}>
                <ActivityIndicator size="small" color="#6200ee" />
                <Text variant="bodySmall" style={styles.inviteSendingText}>Verifying…</Text>
              </View>
            )}
          </>
        )}

        {!!error && <HelperText type="error" visible>{error}</HelperText>}

        <Button
          mode="text"
          onPress={handleResendOtp}
          disabled={sending || verifying}
          icon="refresh"
          style={{ marginTop: 4 }}
        >
          Resend OTP
        </Button>
        <Button
          mode="text"
          onPress={handleCancelInvite}
          disabled={verifying}
        >
          Cancel
        </Button>
      </ScrollView>
    );
  }

  if (phase === 'confirm' && customer) {
    const maxCoins = customer.max_redeemable_coins;
    const parsedCoins = parseInt(coinsToRedeem, 10) || 0;
    const coinValue = (parsedCoins * 0.10).toFixed(2);

    return (
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.heading}>Confirm Payment</Text>
        <Card style={styles.card} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardName}>{customer.name ?? customer.mobile_number}</Text>
            {customer.name && <Text variant="bodySmall" style={styles.cardMobile}>{customer.mobile_number}</Text>}
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

        {maxCoins > 0 && (
          <TextInput
            label={`Coins to Redeem (max ${maxCoins})`}
            value={coinsToRedeem}
            onChangeText={(t) => { setCoinsToRedeem(t); setError(''); }}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.input}
            left={<TextInput.Icon icon="hand-coin" />}
            right={parsedCoins > 0 ? <TextInput.Affix text={`= ₹${coinValue} off`} /> : undefined}
            error={parsedCoins > maxCoins}
          />
        )}
        {parsedCoins > maxCoins && (
          <HelperText type="error" visible>Cannot redeem more than {maxCoins} coins.</HelperText>
        )}
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
        <Button mode="text" onPress={handleReset} disabled={checkout.isPending} style={{ marginTop: 4 }}>
          Cancel
        </Button>
      </ScrollView>
    );
  }

  if (phase === 'receipt' && receipt) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.successIcon}>
          <MaterialCommunityIcons name="check-circle" size={72} color="#2e7d32" />
        </View>
        <Text variant="headlineSmall" style={[styles.heading, { textAlign: 'center' }]}>
          Payment Confirmed
        </Text>
        {receipt.notification_sent && (
          <Text variant="bodySmall" style={styles.notifSent}>WhatsApp/SMS sent to customer</Text>
        )}
        <Card style={styles.card} elevation={2}>
          <Card.Content>
            <Row label="Bill Amount" value={`₹${receipt.amount.toFixed(2)}`} />
            {receipt.discount_applied > 0 && (
              <Row label="Coupon Discount" value={`−₹${receipt.discount_applied.toFixed(2)}`} highlight />
            )}
            {receipt.coins_redeemed > 0 && (
              <Row label={`Coins Redeemed (${receipt.coins_redeemed})`} value={`−₹${receipt.coins_redeemed_value.toFixed(2)}`} highlight />
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
        <Button mode="contained" onPress={handleReset} style={styles.button} contentStyle={styles.buttonContent} icon="plus">
          New Payment
        </Button>
      </ScrollView>
    );
  }

  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// Offers management panel
// ══════════════════════════════════════════════════════════════════════════════

function OffersPanel() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null); // campaign id being updated

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['adminCampaigns'],
    queryFn: () => getCampaigns(false),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleCampaign(id, is_active),
    onMutate: async ({ id, is_active }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['adminCampaigns'] });
      const prev = queryClient.getQueryData<Campaign[]>(['adminCampaigns']);
      queryClient.setQueryData<Campaign[]>(['adminCampaigns'], (old) =>
        old?.map((c) => (c.id === id ? { ...c, is_active } : c)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['adminCampaigns'], ctx?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCampaigns'] });
      queryClient.invalidateQueries({ queryKey: ['offerBanners'] });
    },
  });

  const handlePickImage = async (campaign: Campaign) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    try {
      setUploading(campaign.id);
      const url = await uploadOfferImage(result.assets[0].uri);
      // Call PATCH via the campaigns API directly (reuse axios)
      const { api } = await import('../../src/api/client');
      await api.patch(`/admin/campaigns/${campaign.id}`, { image_url: url });
      queryClient.invalidateQueries({ queryKey: ['adminCampaigns'] });
      queryClient.invalidateQueries({ queryKey: ['offerBanners'] });
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Could not upload image');
    } finally {
      setUploading(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!campaigns?.length) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.empty}>No campaigns yet. Create one via the API.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: 8 }]}>
      {campaigns.map((campaign) => (
        <Card key={campaign.id} style={styles.campaignCard} elevation={1}>
          {campaign.image_url ? (
            <Image source={{ uri: campaign.image_url }} style={styles.campaignImage} resizeMode="cover" />
          ) : (
            <View style={styles.campaignImagePlaceholder}>
              <MaterialCommunityIcons name="image-outline" size={32} color="#bdbdbd" />
            </View>
          )}
          <Card.Content style={{ paddingTop: 10 }}>
            <View style={styles.campaignHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="titleSmall" style={styles.campaignTitle}>{campaign.title}</Text>
                <Text variant="bodySmall" style={styles.campaignType}>
                  {campaign.type === 'percentage'
                    ? `${campaign.discount_value}% off`
                    : campaign.type === 'flat'
                    ? `₹${campaign.discount_value} off`
                    : 'Coins bonus'}
                  {campaign.min_order_value > 0 ? `  •  Min ₹${campaign.min_order_value}` : ''}
                </Text>
                <Text variant="bodySmall" style={styles.campaignDates}>
                  {new Date(campaign.valid_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {' – '}
                  {new Date(campaign.valid_to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                {campaign.usage_limit && (
                  <Text variant="bodySmall" style={styles.usageText}>
                    {campaign.usage_count} / {campaign.usage_limit} used
                  </Text>
                )}
              </View>
              <Switch
                value={campaign.is_active}
                onValueChange={(val) =>
                  toggleMutation.mutate({ id: campaign.id, is_active: val })
                }
                color="#6200ee"
              />
            </View>
          </Card.Content>
          <Card.Actions style={{ paddingTop: 0 }}>
            <Button
              compact
              icon="image"
              mode="text"
              loading={uploading === campaign.id}
              disabled={uploading !== null}
              onPress={() => handlePickImage(campaign)}
            >
              {campaign.image_url ? 'Change Image' : 'Add Image'}
            </Button>
            <Chip compact style={campaignAudienceStyle(campaign.audience_type)}>
              {campaign.audience_type}
            </Chip>
          </Card.Actions>
        </Card>
      ))}
    </ScrollView>
  );
}

function campaignAudienceStyle(audience: string) {
  if (audience === 'all') return { backgroundColor: '#e3f2fd' };
  if (audience === 'specific_users') return { backgroundColor: '#f3e5f5' };
  if (audience === 'has_coins') return { backgroundColor: '#e8f5e9' };
  return { backgroundColor: '#fff8e1' };
}

// ══════════════════════════════════════════════════════════════════════════════
// Root screen
// ══════════════════════════════════════════════════════════════════════════════

export default function AdminScreen() {
  const [tab, setTab] = useState<AdminTab>('checkout');

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.segmentWrapper}>
        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as AdminTab)}
          buttons={[
            { value: 'checkout', label: 'Checkout', icon: 'cash-register' },
            { value: 'offers', label: 'Offers', icon: 'tag-multiple' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {tab === 'checkout' ? <CheckoutPanel /> : <OffersPanel />}
    </View>
  );
}

// ── Shared Row component ──────────────────────────────────────────────────────

function Row({ label, value, highlight, bold }: {
  label: string; value: string; highlight?: boolean; bold?: boolean;
}) {
  return (
    <View style={styles.receiptRow}>
      <Text variant="bodyMedium" style={bold ? styles.boldText : styles.receiptLabel}>{label}</Text>
      <Text variant="bodyMedium" style={[bold ? styles.boldText : undefined, highlight ? styles.highlightText : undefined]}>
        {value}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  segmentWrapper: {
    padding: 12,
    paddingBottom: 0,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  segmentedButtons: { marginBottom: 8 },

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
  expiryBanner: { marginTop: 12, backgroundColor: '#fff8e1', borderRadius: 8, padding: 10 },
  expiryText: { color: '#f57f17' },
  offersSection: { marginBottom: 12 },
  sectionLabel: { color: '#9e9e9e', letterSpacing: 0.8, marginBottom: 8 },
  offerChips: { flexDirection: 'row', gap: 8 },
  offerChip: { marginRight: 4 },
  successIcon: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  notifSent: { color: '#388e3c', textAlign: 'center', marginBottom: 16 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  receiptLabel: { color: '#616161' },
  boldText: { fontWeight: 'bold', color: '#212121' },
  highlightText: { color: '#6200ee' },

  centeredLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { textAlign: 'center', color: '#9e9e9e', marginTop: 24 },
  campaignCard: { marginBottom: 12, borderRadius: 12, overflow: 'hidden' },
  campaignImage: { width: '100%', height: 100 },
  campaignImagePlaceholder: {
    width: '100%', height: 80,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  campaignHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  campaignTitle: { fontWeight: 'bold', color: '#212121', marginBottom: 2 },
  campaignType: { color: '#616161' },
  campaignDates: { color: '#9e9e9e', marginTop: 2 },
  usageText: { color: '#6200ee', marginTop: 2 },
  inviteButton: { marginTop: 8 },
  inviteSending: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 24,
  },
  inviteSendingText: { color: '#757575' },
});
