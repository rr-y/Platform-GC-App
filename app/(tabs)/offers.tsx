import { useState } from 'react';
import { ImageBackground, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, Button, TextInput, HelperText, Divider, Chip, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation } from '@tanstack/react-query';
import { validateCoupon } from '../../src/api/coupons';
import { getOfferBanners, OfferBannerItem } from '../../src/api/offers';
import { formatCurrency } from '../../src/utils/format';

export default function OffersScreen() {
  const [code, setCode] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    discount_amount?: number;
    message?: string;
  } | null>(null);

  const { data: offers, isLoading, refetch: refetchOffers } = useQuery({
    queryKey: ['offerBanners'],
    queryFn: getOfferBanners,
    staleTime: 5 * 60 * 1000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetchOffers();
    setRefreshing(false);
  };

  const { mutate: checkCoupon, isPending } = useMutation({
    mutationFn: () => validateCoupon(code.trim().toUpperCase(), 0),
    onSuccess: (data) => setValidationResult(data),
    onError: (e: any) => {
      setValidationResult({
        valid: false,
        message: e?.response?.data?.detail ?? 'Invalid or expired coupon.',
      });
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} tintColor="#6200ee" />}
    >
      {/* Coupon code checker */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Check a Coupon</Text>
        <Divider />
        <View style={styles.inputRow}>
          <TextInput
            label="Coupon Code"
            value={code}
            onChangeText={(t) => {
              setCode(t);
              setValidationResult(null);
            }}
            mode="outlined"
            autoCapitalize="characters"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={() => checkCoupon()}
            loading={isPending}
            disabled={isPending || !code.trim()}
            style={styles.checkButton}
            contentStyle={styles.checkButtonContent}
          >
            Check
          </Button>
        </View>
        {validationResult && (
          <HelperText
            type={validationResult.valid ? 'info' : 'error'}
            visible
            style={validationResult.valid ? styles.successText : undefined}
          >
            {validationResult.valid
              ? `Valid! Saves you ${formatCurrency(validationResult.discount_amount ?? 0)}`
              : validationResult.message}
          </HelperText>
        )}
      </View>

      {/* Available offers */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Available Offers</Text>
        <Divider />

        {isLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : !offers?.length ? (
          <Text style={styles.empty}>No offers available right now.</Text>
        ) : (
          offers.map((offer) => (
            <OfferCard key={offer.campaign_id} offer={offer} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function OfferCard({ offer }: { offer: OfferBannerItem }) {
  const discountLabel =
    offer.discount_type === 'percentage'
      ? `${offer.discount_value}% off`
      : `Flat ₹${offer.discount_value} off`;

  const expiryDate = new Date(offer.valid_to).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card style={styles.offerCard} mode="outlined">
      {offer.image_url ? (
        <ImageBackground
          source={{ uri: offer.image_url }}
          style={styles.offerImage}
          imageStyle={styles.offerImageStyle}
          resizeMode="cover"
        >
          <View style={styles.imageOverlay} />
          <View style={styles.imageBadge}>
            <Text style={styles.imageBadgeText}>{discountLabel}</Text>
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.offerImage, styles.offerImagePlaceholder]}>
          <Text style={styles.imageBadgeText}>{discountLabel}</Text>
        </View>
      )}
      <Card.Content style={styles.offerContent}>
        <View style={styles.offerHeader}>
          <Text variant="titleSmall" style={styles.offerTitle}>{offer.title}</Text>
          {offer.coupon_code && !offer.is_auto_apply ? (
            <Chip compact textStyle={styles.codeText} style={styles.codeChip}>
              {offer.coupon_code}
            </Chip>
          ) : offer.is_auto_apply ? (
            <Chip compact textStyle={styles.autoText} style={styles.autoChip}>
              Auto-applied
            </Chip>
          ) : null}
        </View>
        {offer.description && (
          <Text variant="bodySmall" style={styles.offerDesc}>{offer.description}</Text>
        )}
        <Text variant="bodySmall" style={styles.offerMeta}>
          {offer.min_order_value > 0 ? `Min ₹${offer.min_order_value}  •  ` : ''}
          Ends {expiryDate}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 32 },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 8, overflow: 'hidden' },
  sectionTitle: { padding: 16, fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 4, gap: 8 },
  input: { flex: 1 },
  checkButton: { marginTop: 6 },
  checkButtonContent: { paddingVertical: 4 },
  successText: { color: '#2e7d32' },
  loader: { padding: 24 },
  empty: { padding: 16, color: '#9e9e9e', textAlign: 'center' },
  offerCard: { marginHorizontal: 12, marginTop: 8, marginBottom: 4, borderRadius: 10, overflow: 'hidden' },
  offerImage: { height: 100, justifyContent: 'flex-end', alignItems: 'flex-end' },
  offerImageStyle: { borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  offerImagePlaceholder: { backgroundColor: '#6200ee', padding: 12 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  imageBadge: {
    backgroundColor: '#ffab00',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    margin: 8,
  },
  imageBadgeText: { color: '#212121', fontWeight: 'bold', fontSize: 12 },
  offerContent: { paddingTop: 10 },
  offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  offerTitle: { flex: 1, fontWeight: 'bold', marginRight: 8 },
  codeChip: { backgroundColor: '#e8f5e9' },
  codeText: { color: '#2e7d32', fontSize: 11, fontWeight: 'bold' },
  autoChip: { backgroundColor: '#ede7f6' },
  autoText: { color: '#6200ee', fontSize: 10 },
  offerDesc: { color: '#616161', marginBottom: 4 },
  offerMeta: { color: '#9e9e9e', marginTop: 2 },
});
