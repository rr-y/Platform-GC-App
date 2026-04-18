import { useEffect, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { SkeletonBox } from './SkeletonBox';
import type { OfferBannerItem } from '../api/offers';

const CARD_HEIGHT = 180;
const AUTO_SCROLL_MS = 3500;

// ── Single card ───────────────────────────────────────────────────────────────

function OfferCard({ item, width }: { item: OfferBannerItem; width: number }) {
  const discountLabel =
    item.discount_type === 'percentage'
      ? `${item.discount_value}% OFF`
      : `₹${item.discount_value} OFF`;

  if (item.image_url) {
    // Image available — show it full bleed, discount badge only
    return (
      <View style={[styles.card, { width }]}>
        <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{discountLabel}</Text>
        </View>
      </View>
    );
  }

  // No image — clean branded fallback
  return (
    <View style={[styles.card, styles.fallback, { width }]}>
      <Text style={styles.fallbackDiscount}>{discountLabel}</Text>
      <Text style={styles.fallbackTitle} numberOfLines={1}>{item.title}</Text>
      {item.min_order_value > 0 && (
        <Text style={styles.fallbackSub}>Min order ₹{item.min_order_value}</Text>
      )}
      {item.coupon_code && !item.is_auto_apply && (
        <View style={styles.codePill}>
          <Text style={styles.codeText}>{item.coupon_code}</Text>
        </View>
      )}
    </View>
  );
}

// ── Dot indicators ────────────────────────────────────────────────────────────

function Dots({ total, current }: { total: number; current: number }) {
  if (total <= 1) return null;
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
      ))}
    </View>
  );
}

// ── Carousel ──────────────────────────────────────────────────────────────────

type Props = { data: OfferBannerItem[]; loading: boolean };

export function OfferBannerCarousel({ data, loading }: Props) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    if (data.length <= 1) return;
    const timer = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % data.length;
      listRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
      setDotIndex(indexRef.current);
    }, AUTO_SCROLL_MS);
    return () => clearInterval(timer);
  }, [data.length]);

  if (!loading && data.length === 0) return null;

  if (loading) {
    return (
      <SkeletonBox
        width="100%"
        height={CARD_HEIGHT}
        borderRadius={0}
        style={{ marginBottom: 8 }}
      />
    );
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={listRef}
        horizontal
        data={data}
        keyExtractor={(item) => item.campaign_id}
        renderItem={({ item }) => <OfferCard item={item} width={width} />}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          indexRef.current = idx;
          setDotIndex(idx);
        }}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
      <Dots total={data.length} current={dotIndex} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  card: {
    height: CARD_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#6200ee',
  },

  // Image variant — badge only
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffab00',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#212121',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Fallback variant
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 6,
  },
  fallbackDiscount: {
    color: '#ffab00',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  fallbackTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  fallbackSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 2,
  },
  codePill: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  codeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1c4e9',
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: '#6200ee',
  },
});
