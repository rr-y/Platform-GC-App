import { FlatList, ImageBackground, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { SkeletonBox } from './SkeletonBox';
import type { OfferBannerItem } from '../api/offers';

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return <SkeletonBox width={260} height={140} borderRadius={14} style={styles.card} />;
}

// ── Single card ───────────────────────────────────────────────────────────────

function OfferCard({ item }: { item: OfferBannerItem }) {
  const discountLabel =
    item.discount_type === 'percentage'
      ? `${item.discount_value}% OFF`
      : `₹${item.discount_value} OFF`;

  const expiryDate = new Date(item.valid_to).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <View style={styles.card}>
      <ImageBackground
        source={item.image_url ? { uri: item.image_url } : undefined}
        style={styles.cardBg}
        imageStyle={styles.cardBgImage}
        resizeMode="cover"
      >
        {/* dark overlay so text is always readable */}
        <View style={styles.overlay} />

        {/* Discount badge — top right */}
        <View style={styles.discountBadge}>
          <Text variant="labelMedium" style={styles.discountText}>{discountLabel}</Text>
        </View>

        {/* Bottom content */}
        <View style={styles.cardContent}>
          <Text variant="titleSmall" style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.description ? (
            <Text variant="bodySmall" style={styles.cardDesc} numberOfLines={1}>
              {item.description}
            </Text>
          ) : item.min_order_value > 0 ? (
            <Text variant="bodySmall" style={styles.cardDesc}>
              Min order ₹{item.min_order_value}
            </Text>
          ) : null}
          <View style={styles.cardFooter}>
            {item.coupon_code && !item.is_auto_apply ? (
              <Chip compact style={styles.codeChip} textStyle={styles.codeText}>
                {item.coupon_code}
              </Chip>
            ) : (
              <Chip compact style={styles.autoChip} textStyle={styles.autoText}>
                Auto-applied
              </Chip>
            )}
            <Text variant="labelSmall" style={styles.expiryText}>
              Ends {expiryDate}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

// ── Carousel ──────────────────────────────────────────────────────────────────

type Props = {
  data: OfferBannerItem[];
  loading: boolean;
};

export function OfferBannerCarousel({ data, loading }: Props) {
  if (!loading && data.length === 0) return null;

  if (loading) {
    return (
      <View style={styles.container}>
        <FlatList
          horizontal
          data={[1, 2, 3]}
          keyExtractor={(i) => String(i)}
          renderItem={() => <SkeletonCard />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.campaign_id}
        renderItem={({ item }) => <OfferCard item={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const CARD_WIDTH = 260;
const CARD_HEIGHT = 140;

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  listContent: { paddingHorizontal: 20, gap: 12 },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardBg: {
    flex: 1,
    backgroundColor: '#6200ee',
    justifyContent: 'flex-end',
  },
  cardBgImage: { borderRadius: 14 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ffab00',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: { color: '#212121', fontWeight: 'bold', fontSize: 12 },
  cardContent: { padding: 12 },
  cardTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 2 },
  cardDesc: { color: 'rgba(255,255,255,0.85)', marginBottom: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeChip: { backgroundColor: 'rgba(255,255,255,0.2)', height: 24 },
  codeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  autoChip: { backgroundColor: 'rgba(255,255,255,0.15)', height: 24 },
  autoText: { color: 'rgba(255,255,255,0.85)', fontSize: 10 },
  expiryText: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
});
