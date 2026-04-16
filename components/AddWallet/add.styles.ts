import { StyleSheet } from 'react-native';
import { GRADIENT_HEIGHT, THEME } from './theme';

// ─── Layout ──────────────────────────────────────────────
export const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flexOne: {
    flex: 1,
  },
  topGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: GRADIENT_HEIGHT,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

// ─── Header ──────────────────────────────────────────────
export const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    gap: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backIcon: {
    fontSize: 22,
    color: THEME.text,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
    letterSpacing: -0.2,
  },
  headerRightPlaceholder: {
    width: 40,
  },
});

// ─── Type Selector ───────────────────────────────────────
export const selectorStyles = StyleSheet.create({
  selectorContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  selectorTrack: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    padding: 0,
    width: 220,
    height: 44,
    position: 'relative',
  },
  selectorIndicator: {
    position: 'absolute',
    width: 106,
    height: 36,
    backgroundColor: '#000000',
    borderRadius: 18,
    top: 4,
    left: 0,
  },
  selectorTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

// ─── Amount Input ────────────────────────────────────────
export const amountStyles = StyleSheet.create({
  amountContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.textTertiary,
    letterSpacing: 1,
    marginTop: 12,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '300',
    color: '#CCCCCC',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: '600',
    color: THEME.text,
    textAlign: 'center',
    padding: 0,
    letterSpacing: -1.5,
  },
  decimalDot: {
    fontSize: 36,
    fontWeight: '300',
    color: '#CCCCCC',
  },
  decimalInput: {
    fontSize: 28,
    fontWeight: '400',
    color: '#999999',
    textAlign: 'center',
    padding: 0,
    minWidth: 30,
  },
  errorTextCenter: {
    color: THEME.error,
    fontSize: 12,
    marginTop: 12,
    fontWeight: '500',
  },
});

// ─── Form Fields ─────────────────────────────────────────
export const fieldStyles = StyleSheet.create({
  formGroup: {
    paddingHorizontal: 24,
    gap: 8,
  },
  fieldWrapper: {
    marginBottom: 0,
  },
  fieldContainer: {
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
  },
  fieldActive: {
    borderColor: '#999',
  },
  fieldError: {
    borderColor: THEME.error,
  },
  fieldLabel: {
    fontSize: 10,
    color: THEME.textTertiary,
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldInput: {
    fontSize: 15,
    color: THEME.text,
    flex: 1,
    padding: 0,
    height: 24,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '500',
    color: THEME.text,
  },
  fieldPlaceholder: {
    color: THEME.textTertiary,
    fontWeight: '400',
  },
  errorText: {
    color: THEME.error,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
});

// ─── Pending Toggle ──────────────────────────────────────
export const pendingStyles = StyleSheet.create({
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 1,
  },
  pendingActive: {
    backgroundColor: '#FFF9E6',
    borderColor: '#F5C842',
  },
  pendingCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingCheckboxActive: {
    backgroundColor: '#F5C842',
    borderColor: '#F5C842',
  },
  pendingCheck: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -1,
  },
  pendingTextContainer: {
    flex: 1,
  },
  pendingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.text,
  },
  pendingLabelActive: {
    color: '#B8860B',
  },
  pendingHint: {
    fontSize: 11,
    color: THEME.textTertiary,
    marginTop: 2,
  },
});

// ─── Swipe Button ────────────────────────────────────────
export const swipeStyles = StyleSheet.create({
  track: {
    height: 58,
    backgroundColor: '#f3f4f6',
    borderRadius: 29,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  labelContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  label: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
  thumb: {
    width: 50,
    height: 50,
    backgroundColor: '#000',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

// ─── Tags ────────────────────────────────────────────────
export const tagStyles = StyleSheet.create({
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: THEME.border,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  colorSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginHorizontal: 3,
  },
});

// ─── Footer / Navigation Chips ───────────────────────────
export const footerStyles = StyleSheet.create({
  chipButton: {
    backgroundColor: '#fafafaff',
    borderRadius: 999,
    paddingVertical: 0.1,
    minHeight: 40,
    paddingHorizontal: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipLabel: {
    color: '#111',
    fontWeight: '600',
  },
  centerChip: {
    alignItems: 'center',
    marginVertical: 2,
  },
});

// ─── Tag Modal ───────────────────────────────────────────
export const tagModalStyles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: THEME.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionCompact: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: THEME.textTertiary,
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionLabelCompact: {
    fontSize: 11,
    color: THEME.textTertiary,
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: THEME.text,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  previewText: {
    fontWeight: '600',
    fontSize: 13,
  },
  paletteDots: {
    flexDirection: 'row',
    gap: 3,
  },
  paletteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paletteNumber: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paletteNumberText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  submitSection: {
    paddingBottom: 12,
  },
  manageLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  manageLinkText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
});
