import React from 'react';
import { View, StyleSheet } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { TagBreakdown } from '@/shared/services/wallet/analytics.service';
import { colors } from '@/shared/theme/colors';

interface TagDistributionProps {
  tags: TagBreakdown[];
}

function TagSection({ title, tags }: { title: string; tags: TagBreakdown[] }) {
  if (!tags.length) return null;

  const total = tags.reduce((sum, t) => sum + t.total, 0);
  const maxVal = Math.max(...tags.map((t) => t.total), 1);

  return (
    <View style={styles.section}>
      <TextMalet style={styles.sectionTitle}>{title}</TextMalet>
      <View style={styles.list}>
        {tags.map((tag, index) => {
          const pct = total > 0 ? (tag.total / total) * 100 : 0;
          const barWidth = (tag.total / maxVal) * 100;
          const color = tag.tag_color || '#9e9e9e';

          return (
            <View key={`${tag.tag_id}-${tag.type}`} style={[styles.row, index === tags.length - 1 && styles.rowLast]}>
              <View style={styles.labelRow}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <TextMalet style={styles.tagName} numberOfLines={1}>
                  {tag.tag_name}
                </TextMalet>
                <TextMalet style={styles.tagPct}>{pct.toFixed(0)}%</TextMalet>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${barWidth}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
              <TextMalet style={styles.tagAmount}>
                ${tag.total.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TextMalet>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function TagDistribution({ tags }: TagDistributionProps) {
  if (!tags.length) {
    return (
      <View style={styles.empty}>
        <TextMalet style={styles.emptyText}>Sin etiquetas en este periodo</TextMalet>
      </View>
    );
  }

  const expenseTags = tags
    .filter((t) => t.type === 'expense' || t.type === 'pending_payment')
    .sort((a, b) => b.total - a.total);

  const incomeTags = tags
    .filter((t) => t.type === 'saving')
    .sort((a, b) => b.total - a.total);

  return (
    <View style={styles.container}>
      <TagSection title="Egresos" tags={expenseTags} />
      <TagSection title="Ingresos" tags={incomeTags} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: 12,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.3)',
  },
  row: {
    gap: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowLast: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagName: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.7)',
    flex: 1,
  },
  tagPct: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.35)',
    width: 36,
    textAlign: 'right',
  },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  tagAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.55)',
    textAlign: 'right',
  },
});
