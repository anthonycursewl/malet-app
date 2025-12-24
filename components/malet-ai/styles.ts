import { Platform, StatusBar, StyleSheet } from "react-native";

export const BANNER_IMAGE = "https://images-r2-1.thebrag.com/var/uploads/2025/11/GettyImages-2234281656-681x383.jpg";

export const SUGGESTIONS = [
    { id: '1', text: "Plan de ahorro" },
    { id: '2', text: "Analizar gastos" },
    { id: '3', text: "Inversiones" },
    { id: '4', text: "Reducir deudas" },
];

export const TIPS = [
    "Basado en tus gastos recientes, podrías ahorrar un 15% si reduces las comidas fuera de casa esta semana.",
    "Tu balance ha mejorado un 8% este mes. ¡Sigue así!",
    "Considera destinar el 20% de tus ingresos al ahorro.",
];

// Markdown styles for AI messages
export const getMarkdownStyles = () => ({
    body: {
        color: '#1F2937',
        fontSize: 15,
        lineHeight: 22,
    },
    heading1: {
        color: '#1F2937',
        fontSize: 20,
        fontWeight: '700' as const,
        marginTop: 12,
        marginBottom: 8,
    },
    heading2: {
        color: '#1F2937',
        fontSize: 18,
        fontWeight: '600' as const,
        marginTop: 10,
        marginBottom: 6,
    },
    heading3: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600' as const,
        marginTop: 8,
        marginBottom: 4,
    },
    paragraph: {
        marginTop: 0,
        marginBottom: 8,
    },
    strong: {
        fontWeight: '700' as const,
        color: '#1F2937',
    },
    em: {
        fontStyle: 'italic' as const,
    },
    link: {
        color: '#4F46E5',
        textDecorationLine: 'underline' as const,
    },
    blockquote: {
        backgroundColor: '#F3F4F6',
        borderLeftColor: '#4F46E5',
        borderLeftWidth: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginVertical: 8,
        borderRadius: 4,
    },
    code_inline: {
        backgroundColor: '#F3F4F6',
        color: '#DC2626',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
    },
    code_block: {
        backgroundColor: '#1F2937',
        color: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
        lineHeight: 20,
        overflow: 'hidden' as const,
    },
    fence: {
        backgroundColor: '#1F2937',
        color: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
        lineHeight: 20,
    },
    list_item: {
        marginVertical: 2,
    },
    bullet_list: {
        marginVertical: 4,
    },
    ordered_list: {
        marginVertical: 4,
    },
    bullet_list_icon: {
        color: '#4F46E5',
        marginRight: 8,
    },
    ordered_list_icon: {
        color: '#4F46E5',
        marginRight: 8,
    },
    table: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        marginVertical: 8,
    },
    thead: {
        backgroundColor: '#F3F4F6',
    },
    th: {
        padding: 8,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
        fontWeight: '600' as const,
    },
    tr: {
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    td: {
        padding: 8,
        borderRightWidth: 1,
        borderColor: '#E5E7EB',
    },
    hr: {
        backgroundColor: '#E5E7EB',
        height: 1,
        marginVertical: 12,
    },
});

export const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    bannerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 180,
        zIndex: 0,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        opacity: 0.6,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 44) + 8 : 52,
        paddingBottom: 12,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    backText: {
        fontSize: 26,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: -2,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 12,
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(238, 238, 238, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerTextContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#4B5563',
    },
    headerBadge: {
        backgroundColor: 'rgba(254, 243, 199, 0.95)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    headerBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#B45309',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    contentWrapper: {
        flex: 1,
    },
    welcomeContainer: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    welcomeContent: {
        paddingTop: 32,
        paddingBottom: 24,
    },
    aiAvatarContainer: {
        marginBottom: 20,
    },
    aiCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    greeting: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 6,
    },
    subGreeting: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
        marginBottom: 28,
    },
    suggestionsContainer: {
        width: '100%',
        marginBottom: 20,
    },
    suggestionsTitle: {
        fontSize: 11,
        fontWeight: '500',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
        textAlign: 'center',
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    suggestionChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    suggestionText: {
        color: '#4B5563',
        fontSize: 13,
        fontWeight: '500',
    },
    contextCard: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.15)',
    },
    contextGradient: {
        padding: 20,
    },
    contextHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    contextIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    contextIcon: {
        fontSize: 14,
    },
    contextTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4F46E5',
    },
    contextText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#4B5563',
    },
    messagesContent: {
        padding: 8,
        paddingBottom: 8,
    },
    messageBubbleContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
        paddingHorizontal: 8,
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    aiMessageContainer: {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    aiAvatarSmall: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    messageBubble: {
        maxWidth: '100%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: '#4F46E5',
        borderBottomRightRadius: 6,
    },
    aiBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userMessageText: {
        color: '#fff',
    },
    aiMessageText: {
        color: '#1F2937',
    },
    errorMessageText: {
        color: '#991B1B',
    },
    thinkingContainer: {
        marginLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
    },
    thinkingLogoContainer: {
        marginRight: 8,
    },
    thinkingLogo: {
        width: 30,
        height: 30,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    thinkingShimmer: {
        ...StyleSheet.absoluteFillObject,
        width: 100,
    },
    thinkingTextContainer: {
        position: 'relative',
        overflow: 'hidden',
        paddingHorizontal: 2,
    },
    thinkingText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    thinkingTextShimmer: {
        ...StyleSheet.absoluteFillObject,
        width: 160,
    },
    typingCursor: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    inputWrapper: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    inputWrapperClosed: {
        paddingBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'flex-end',
        gap: 10,
    },
    inputFieldContainer: {
        flex: 1,
    },
    inputField: {
        width: '100%',
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    sendButtonTextDisabled: {
        color: '#9CA3AF',
    },
    disclaimer: {
        fontSize: 10,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    shimmerBase: {
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
    },
    shimmerOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    skeletonContainer: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    skeletonAiContainer: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 32,
    },
    skeletonAiCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    skeletonSuggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 24,
    },
    skeletonTipCard: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 20,
    },
    rateLimitContainer: {
        backgroundColor: '#fef3c7',
        borderTopWidth: 1,
        borderTopColor: '#fcd34d',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    rateLimitContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rateLimitIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fde68a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rateLimitIcon: {
        fontSize: 16,
    },
    rateLimitTextContainer: {
        flex: 1,
    },
    rateLimitTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400e',
    },
    rateLimitMessage: {
        fontSize: 13,
        color: '#a16207',
        marginTop: 2,
    },
    rateLimitCountdown: {
        fontWeight: '700',
        color: '#d97706',
        fontSize: 15,
    },
    rateLimitProgressBar: {
        height: 3,
        backgroundColor: '#fde68a',
        borderRadius: 2,
        marginTop: 10,
        overflow: 'hidden',
    },
    rateLimitProgressFill: {
        height: '100%',
        backgroundColor: '#f59e0b',
        borderRadius: 2,
    },
    messageContentWrapper: {
        maxWidth: '85%',
    },
    errorBubble: {
        borderColor: '#EF4444',
        borderWidth: 1,
        backgroundColor: '#FEF2F2',
    },
    messageActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 6,
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
    },
    actionButtonIcon: {
        fontSize: 12,
        color: '#4F46E5',
        marginRight: 4,
    },
    actionButtonText: {
        fontSize: 11,
        color: '#4F46E5',
        fontWeight: '500',
    },
    feedbackContainer: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 8,
    },
    feedbackButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    feedbackButtonActive: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FECACA',
    },
    feedbackButtonActiveDislike: {
        backgroundColor: '#F3F4F6',
        borderColor: '#9CA3AF',
    },
    feedbackIcon: {
        fontSize: 14,
    },
    feedbackIconActive: {
        fontSize: 14,
    },
    feedbackIconActiveDislike: {
        fontSize: 14,
    },
});
