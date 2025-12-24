import TextMalet from "@/components/TextMalet/TextMalet";
import IconAt from "@/svgs/dashboard/IconAt";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, TouchableOpacity, View } from "react-native";
import Markdown from 'react-native-markdown-display';
import { getMarkdownStyles, styles } from "./styles";
import { Message } from "./types";

interface MessageBubbleProps {
    message: Message;
    index: number;
    isNewMessage?: boolean;
    hasAnimated?: boolean;
    onTypingProgress?: () => void;
    onTypingComplete?: (messageId: string) => void;
    onRetry?: (messageId: string) => void;
    onEdit?: (messageId: string, text: string) => void;
    onFeedback?: (messageId: string, type: 'like' | 'dislike') => void;
}

export const MessageBubble = memo(({
    message,
    index,
    isNewMessage = false,
    hasAnimated = false,
    onTypingProgress,
    onTypingComplete,
    onRetry,
    onEdit,
    onFeedback,
}: MessageBubbleProps) => {
    const fadeAnim = useRef(new Animated.Value(hasAnimated ? 1 : 0)).current;
    const slideAnim = useRef(new Animated.Value(hasAnimated ? 0 : 20)).current;
    const [displayedText, setDisplayedText] = useState(hasAnimated ? message.text : '');
    const [isTypingComplete, setIsTypingComplete] = useState(hasAnimated || !isNewMessage || message.isUser);
    const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

    useEffect(() => {
        if (hasAnimated) return;

        const delay = Math.min(index * 50, 200);
        const timeout = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, [index, fadeAnim, slideAnim, hasAnimated]);

    useEffect(() => {
        if (hasAnimated) {
            setDisplayedText(message.text);
            setIsTypingComplete(true);
            return;
        }

        if (!message.isUser && isNewMessage && !isTypingComplete) {
            const text = message.text;
            let currentIndex = 0;
            let scrollCounter = 0;
            setDisplayedText('');

            const typeInterval = setInterval(() => {
                if (currentIndex < text.length) {
                    const charsToAdd = Math.min(Math.floor(Math.random() * 5) + 2, text.length - currentIndex);
                    setDisplayedText(text.substring(0, currentIndex + charsToAdd));
                    currentIndex += charsToAdd;

                    scrollCounter += charsToAdd;
                    if (scrollCounter >= 10) {
                        scrollCounter = 0;
                        onTypingProgress?.();
                    }
                } else {
                    clearInterval(typeInterval);
                    setIsTypingComplete(true);
                    onTypingComplete?.(message.id);
                    onTypingProgress?.();
                }
            }, 30);

            return () => clearInterval(typeInterval);
        } else {
            setDisplayedText(message.text);
            setIsTypingComplete(true);
        }
    }, [message.text, message.id, message.isUser, isNewMessage, isTypingComplete, hasAnimated, onTypingProgress, onTypingComplete]);

    const handleFeedback = useCallback((type: 'like' | 'dislike') => {
        setFeedback(prev => prev === type ? null : type);
        onFeedback?.(message.id, type);
    }, [message.id, onFeedback]);

    const markdownStyles = useMemo(() => getMarkdownStyles(), []);

    return (
        <Animated.View
            style={[
                styles.messageBubbleContainer,
                message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
        >
            {!message.isUser && (
                <View style={styles.aiAvatarSmall}>
                    <IconAt width={14} height={14} fill="#1F2937" />
                </View>
            )}
            <View style={styles.messageContentWrapper}>
                <View
                    style={[
                        styles.messageBubble,
                        message.isUser ? styles.userBubble : styles.aiBubble,
                        message.status === 'error' && styles.errorBubble,
                    ]}
                >
                    {message.isUser ? (
                        <TextMalet style={[
                            styles.messageText,
                            message.status === 'error' ? styles.errorMessageText : styles.userMessageText
                        ]}>
                            {message.text}
                        </TextMalet>
                    ) : (
                        <View>
                            <Markdown style={markdownStyles}>
                                {displayedText}
                            </Markdown>
                            {!isTypingComplete && (
                                <TextMalet style={styles.typingCursor}>|</TextMalet>
                            )}
                        </View>
                    )}
                </View>

                {/* Actions for user messages */}
                {message.isUser && isTypingComplete && (
                    <View style={styles.messageActions}>
                        {message.status === 'error' && onRetry && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => onRetry(message.id)}
                                activeOpacity={0.7}
                            >
                                <TextMalet style={styles.actionButtonIcon}>↻</TextMalet>
                                <TextMalet style={styles.actionButtonText}>Reintentar</TextMalet>
                            </TouchableOpacity>
                        )}
                        {onEdit && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => onEdit(message.id, message.text)}
                                activeOpacity={0.7}
                            >
                                <TextMalet style={styles.actionButtonIcon}>✎</TextMalet>
                                <TextMalet style={styles.actionButtonText}>Editar</TextMalet>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Feedback for AI messages */}
                {!message.isUser && isTypingComplete && (
                    <View style={styles.feedbackContainer}>
                        <TouchableOpacity
                            style={[
                                styles.feedbackButton,
                                feedback === 'like' && styles.feedbackButtonActive
                            ]}
                            onPress={() => handleFeedback('like')}
                            activeOpacity={0.7}
                        >
                            <TextMalet style={[
                                styles.feedbackIcon,
                                feedback === 'like' && styles.feedbackIconActive
                            ]}>
                                {feedback === 'like' ? '❤️' : '🤍'}
                            </TextMalet>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.feedbackButton,
                                feedback === 'dislike' && styles.feedbackButtonActiveDislike
                            ]}
                            onPress={() => handleFeedback('dislike')}
                            activeOpacity={0.7}
                        >
                            <TextMalet style={[
                                styles.feedbackIcon,
                                feedback === 'dislike' && styles.feedbackIconActiveDislike
                            ]}>
                                {feedback === 'dislike' ? '👎' : '👎🏻'}
                            </TextMalet>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Animated.View>
    );
});

MessageBubble.displayName = 'MessageBubble';
