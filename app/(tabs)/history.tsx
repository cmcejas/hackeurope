import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { fetchHistory, type HistoryItem } from '../../lib/api';
import { colors, spacing, radii, fonts } from './theme';
import { GradientBackground } from './GradientBackground';
import { GlassCard } from './GlassCard';

// Severity color helper (moved from theme to avoid import issues)
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'severe':
      return colors.danger;
    case 'moderate':
      return colors.warning;
    case 'mild':
      return colors.success;
    default:
      return colors.success;
  }
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchHistory(user.id);
      setHistory(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load history';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'alert-circle';
      case 'moderate':
        return 'warning';
      case 'mild':
        return 'information-circle';
      default:
        return 'checkmark-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <GradientBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.root}>
        <GradientBackground />
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>Not Logged In</Text>
          <Text style={styles.emptyText}>Please log in to view your health check history</Text>
        </View>
      </View>
    );
  }

  if (selectedItem) {
    return (
      <View style={styles.root}>
        <GradientBackground />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setSelectedItem(null)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Health Check Details</Text>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.detailContent}>
            <GlassCard style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreNumber}>{selectedItem.sicknessProbability}%</Text>
                </View>
                <View style={styles.detailHeaderInfo}>
                  <Text style={styles.detailDate}>{formatDate(selectedItem.timestamp!)}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(selectedItem.severity || 'none') }]}>
                    <Ionicons
                      name={getSeverityIcon(selectedItem.severity || 'none')}
                      size={16}
                      color="#FFF"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.severityText}>{selectedItem.severity || 'unknown'}</Text>
                  </View>
                </View>
              </View>

              {selectedItem.shouldSeeDoctor && (
                <View style={styles.warningBanner}>
                  <Ionicons name="warning" size={20} color="#FFF" />
                  <Text style={styles.warningText}>Medical consultation recommended</Text>
                </View>
              )}

              {selectedItem.recommendations && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recommendations</Text>
                  <Text style={styles.sectionText}>{selectedItem.recommendations}</Text>
                </View>
              )}

              {selectedItem.eyeAnalysis && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Eye Analysis</Text>
                  <Text style={styles.sectionText}>{selectedItem.eyeAnalysis}</Text>
                </View>
              )}

              {selectedItem.symptoms && selectedItem.symptoms.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Symptoms</Text>
                  {selectedItem.symptoms.map((symptom, idx) => (
                    <View key={idx} style={styles.symptomItem}>
                      <Ionicons name="ellipse" size={8} color={colors.primary} />
                      <Text style={styles.symptomText}>{symptom}</Text>
                    </View>
                  ))}
                </View>
              )}

              {selectedItem.environmentalFactors && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Environmental Factors</Text>
                  <Text style={styles.sectionText}>{selectedItem.environmentalFactors}</Text>
                </View>
              )}

              {selectedItem.location?.displayName && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Location</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color={colors.textSecondary} />
                    <Text style={styles.locationText}>{selectedItem.location.displayName}</Text>
                  </View>
                </View>
              )}
            </GlassCard>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <GradientBackground />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Health History</Text>
          <Ionicons name="time-outline" size={28} color={colors.textPrimary} />
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyText}>
              Your health check results will appear here after you complete your first check
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
            {history.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedItem(item)}
                activeOpacity={0.7}
              >
                <GlassCard style={styles.historyCard}>
                  <View style={styles.historyCardContent}>
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scorePercent}>{item.sicknessProbability}%</Text>
                      {item.severity && (
                        <Ionicons
                          name={getSeverityIcon(item.severity)}
                          size={20}
                          color={getSeverityColor(item.severity)}
                          style={styles.severityIcon}
                        />
                      )}
                    </View>

                    <View style={styles.historyInfo}>
                      <Text style={styles.historyDate}>{formatDate(item.timestamp!)}</Text>
                      {item.severity && (
                        <Text style={[styles.historySeverity, { color: getSeverityColor(item.severity) }]}>
                          {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                          {item.shouldSeeDoctor ? ' • See doctor' : ''}
                        </Text>
                      )}
                    </View>

                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  historyCard: {
    marginBottom: spacing.md,
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  scoreContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
    minWidth: 70,
  },
  scorePercent: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  severityIcon: {
    marginTop: 2,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  historySeverity: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  detailContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  detailCard: {
    padding: spacing.lg,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  scoreNumber: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailDate: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: '#FFF',
    textTransform: 'capitalize',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + 'CC',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  warningText: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: '#FFF',
    marginLeft: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  symptomText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
});
