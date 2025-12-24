import Input from "@/components/Input/Input";
import {
    AIAvatar,
    BANNER_IMAGE,
    Message,
    MessageBubble,
    RateLimitBanner,
    SkeletonLoader,
    styles,
    SuggestionChip,
    SUGGESTIONS,
    ThinkingIndicator,
    TipCard,
    TIPS
} from "@/components/malet-ai";
import TextMalet from "@/components/TextMalet/TextMalet";
import { useAIChat } from "@/shared/hooks/useAIChat";
import IconAt from "@/svgs/dashboard/IconAt";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    FlatList,
    Image,
    InteractionManager,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AIAgentScreen() {
    const [inputText, setInputText] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [lastNewMessageId, setLastNewMessageId] = useState<string | null>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const contentFadeAnim = useRef(new Animated.Value(0)).current;

    const completedTypingIds = useRef<Set<string>>(new Set()).current;

    const {
        messages: aiMessages,
        isLoading: isTyping,
        error: aiError,
        isServiceAvailable,
        rateLimitCountdown,
        isRateLimited,
        canSendMessage,
        sendMessage: sendAIMessage,
        retryMessage,
        clearMessages,
    } = useAIChat({
        config: {
            systemPrompt: `Eres Malet AI, el asistente financiero de la app Malet.
Ayudas a los usuarios a gestionar sus finanzas personales.
Eres amigable, profesional y respondes en español.
Puedes dar consejos sobre ahorro, presupuestos, inversiones y gastos.
Sé conciso pero útil en tus respuestas.`,
        },
        onError: (error) => {
            if (error.code === 'UNAUTHORIZED' || error.code === 'AI_AUTH_FAILED') {
                Alert.alert(
                    'Sesión expirada',
                    'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            }
        },
        onAuthError: () => {
            router.back();
        },
    });

    const messages = useMemo(() => {
        return aiMessages.map(msg => ({
            id: msg.id,
            text: msg.content,
            isUser: msg.role === 'user',
            timestamp: msg.timestamp,
            status: msg.status as Message['status'],
        }));
    }, [aiMessages]);

    const randomTip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setIsKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setIsKeyboardVisible(false)
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    useEffect(() => {
        const interactionPromise = InteractionManager.runAfterInteractions(() => {
            setIsReady(true);
            Animated.timing(contentFadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        });

        return () => interactionPromise.cancel();
    }, [contentFadeAnim]);

    const handleSendMessage = useCallback(async () => {
        if (!inputText.trim() || isTyping) return;

        const messageText = inputText.trim();
        setInputText('');
        setShowWelcome(false);

        const newMessageId = await sendAIMessage(messageText);
        if (newMessageId) {
            setLastNewMessageId(newMessageId);
        }
    }, [inputText, isTyping, sendAIMessage]);

    const handleSuggestionPress = useCallback((text: string) => {
        setInputText(text);
    }, []);

    const handleBack = useCallback(() => {
        router.back();
    }, []);

    const scrollToBottom = useCallback(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, []);

    const handleTypingComplete = useCallback((messageId: string) => {
        completedTypingIds.add(messageId);
    }, [completedTypingIds]);

    const handleRetry = useCallback((messageId: string) => {
        retryMessage(messageId);
    }, [retryMessage]);

    const handleEdit = useCallback((messageId: string, text: string) => {
        setInputText(text);
    }, []);

    const handleFeedback = useCallback((messageId: string, type: 'like' | 'dislike') => {
        console.log('Feedback:', messageId, type);
    }, []);

    const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => (
        <MessageBubble
            message={item}
            index={index}
            isNewMessage={item.id === lastNewMessageId}
            hasAnimated={completedTypingIds.has(item.id)}
            onTypingProgress={scrollToBottom}
            onTypingComplete={handleTypingComplete}
            onRetry={handleRetry}
            onEdit={handleEdit}
            onFeedback={handleFeedback}
        />
    ), [lastNewMessageId, scrollToBottom, handleTypingComplete, completedTypingIds, handleRetry, handleEdit, handleFeedback]);

    const keyExtractor = useCallback((item: { id: string }) => item.id, []);

    const ListFooterComponent = useMemo(() => {
        if (!isTyping) return null;
        return <ThinkingIndicator />;
    }, [isTyping]);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length, isTyping]);

    return (
        <View style={styles.mainContainer}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Banner Image with gradient overlay */}
            <View style={styles.bannerContainer}>
                <Image
                    source={{ uri: BANNER_IMAGE }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(250,250,250,0)', 'rgba(250,250,250,1)']}
                    locations={[0, 0.5, 1]}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <SafeAreaView style={styles.container} edges={[]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    {/* Premium Header with Glassmorphism */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <TextMalet style={styles.backText}>‹</TextMalet>
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <View style={styles.headerIcon}>
                                <IconAt width={18} height={18} />
                            </View>
                            <View style={styles.headerTextContainer}>
                                <TextMalet style={styles.headerTitle}>Malet AI</TextMalet>
                                <TextMalet style={styles.headerSubtitle}>Tu asistente financiero</TextMalet>
                            </View>
                        </View>
                        <View style={styles.headerBadge}>
                            <TextMalet style={styles.headerBadgeText}>Beta</TextMalet>
                        </View>
                    </View>

                    {/* Content */}
                    {!isReady ? (
                        <SkeletonLoader />
                    ) : (
                        <Animated.View style={[styles.contentWrapper, { opacity: contentFadeAnim }]}>
                            {showWelcome && messages.length === 0 ? (
                                // Welcome Screen
                                <FlatList
                                    data={[]}
                                    renderItem={null}
                                    ListHeaderComponent={
                                        <View style={styles.welcomeContainer}>
                                            {/* AI Avatar */}
                                            <AIAvatar />

                                            <TextMalet style={styles.greeting}>¡Hola! Soy Malet AI</TextMalet>
                                            <TextMalet style={styles.subGreeting}>
                                                Tu asistente personal de finanzas. Pregúntame sobre ahorro, inversiones, o cómo mejorar tu situación financiera.
                                            </TextMalet>

                                            {/* Suggestions */}
                                            <View style={styles.suggestionsContainer}>
                                                <TextMalet style={styles.suggestionsTitle}>Sugerencias para comenzar</TextMalet>
                                                <View style={styles.suggestionsGrid}>
                                                    {SUGGESTIONS.map((suggestion, index) => (
                                                        <SuggestionChip
                                                            key={suggestion.id}
                                                            suggestion={suggestion}
                                                            onPress={() => handleSuggestionPress(suggestion.text)}
                                                            delay={index * 100}
                                                        />
                                                    ))}
                                                </View>
                                            </View>

                                            {/* Tip Card */}
                                            <TipCard tip={randomTip} />
                                        </View>
                                    }
                                    contentContainerStyle={styles.welcomeContent}
                                    showsVerticalScrollIndicator={false}
                                />
                            ) : (
                                // Chat Messages
                                <FlatList
                                    ref={flatListRef}
                                    data={messages}
                                    renderItem={renderMessage}
                                    keyExtractor={keyExtractor}
                                    contentContainerStyle={styles.messagesContent}
                                    showsVerticalScrollIndicator={false}
                                    ListFooterComponent={ListFooterComponent}
                                    initialNumToRender={10}
                                    maxToRenderPerBatch={5}
                                    windowSize={5}
                                />
                            )}
                        </Animated.View>
                    )}

                    {/* Rate Limit Countdown */}
                    {isRateLimited && rateLimitCountdown !== null && (
                        <RateLimitBanner countdown={rateLimitCountdown} />
                    )}

                    {/* Input Area */}
                    <View style={[styles.inputWrapper, !isKeyboardVisible && styles.inputWrapperClosed]}>
                        <View style={styles.inputContainer}>
                            <View style={styles.inputFieldContainer}>
                                <Input
                                    style={styles.inputField}
                                    placeholder={isRateLimited ? `Espera ${rateLimitCountdown}s...` : "Escribe tu consulta..."}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    editable={!isRateLimited}
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    (!inputText.trim() || !canSendMessage) && styles.sendButtonDisabled
                                ]}
                                onPress={handleSendMessage}
                                disabled={!inputText.trim() || !canSendMessage}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={(inputText.trim() && canSendMessage) ? ['#4F46E5', '#7C3AED'] : ['#E5E7EB', '#D1D5DB']}
                                    style={styles.sendGradient}
                                >
                                    <TextMalet style={[
                                        styles.sendButtonText,
                                        (!inputText.trim() || !canSendMessage) && styles.sendButtonTextDisabled
                                    ]}>
                                        ↑
                                    </TextMalet>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        <TextMalet style={styles.disclaimer}>
                            Malet AI puede cometer errores. Verifica la información importante.
                        </TextMalet>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
