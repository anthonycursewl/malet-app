import Button from '@/components/Button/Button';
import TextMalet from '@/components/TextMalet/TextMalet';
import { APP_UPDATES, AppUpdate, LATEST_APP_VERSION } from '@/shared/constants/updates';
import { spacing } from '@/shared/theme';
import IconAt from '@/svgs/dashboard/IconAt';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Modal, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

const UPDATES_VERSION_KEY = '@malet_updates_version';

export default function UpdatesModal() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentUpdate, setCurrentUpdate] = useState<AppUpdate | null>(null);

    // Animations
    const [fadeAnim] = useState(new Animated.Value(0));
    const [translateY] = useState(new Animated.Value(50));

    useEffect(() => {
        checkUpdates();
    }, []);

    const checkUpdates = async () => {
        try {
            const storedVersion = await AsyncStorage.getItem(UPDATES_VERSION_KEY);

            // If no version stored, or stored version is older than latest
            if (!storedVersion || storedVersion !== LATEST_APP_VERSION) {
                const updateInfo = APP_UPDATES.find(u => u.version === LATEST_APP_VERSION);
                if (updateInfo) {
                    setCurrentUpdate(updateInfo);
                    setIsVisible(true);
                    startEntryAnimation();
                }
            }
        } catch (e) {
            console.error('Error checking update version inside UpdatesModal', e);
        }
    };

    const startEntryAnimation = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleDismiss = async () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 30,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(async () => {
            setIsVisible(false);
            try {
                await AsyncStorage.setItem(UPDATES_VERSION_KEY, LATEST_APP_VERSION);
            } catch (e) {
                console.error('Failed saving update version', e);
            }
        });
    };

    if (!currentUpdate) return null;

    return (
        <Modal
            visible={isVisible}
            animationType="none"
            transparent={true}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.modalContainer,
                    { opacity: fadeAnim, transform: [{ translateY }] }
                ]}>
                    <SafeAreaView style={styles.safeArea}>
                        <LinearGradient
                            colors={['#ffffff', '#f8fafc', '#f1f5f9']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        />

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            bounces={false}
                        >
                            {/* Header section with brand */}
                            <View style={styles.header}>
                                <View style={styles.logoWrapper}>
                                    <IconAt width={50} height={50} />
                                </View>
                                <View style={styles.badgeContainer}>
                                    <TextMalet style={styles.badgeText}>v{currentUpdate.version}</TextMalet>
                                </View>
                                <TextMalet style={styles.title}>
                                    Novedades en Malet
                                </TextMalet>
                                <TextMalet style={styles.subtitle}>
                                    {currentUpdate.title}
                                </TextMalet>
                            </View>

                            {/* Features List */}
                            <View style={styles.featuresContainer}>
                                {currentUpdate.features.map((feature, idx) => (
                                    <View key={idx} style={styles.featureRow}>
                                        <View style={styles.iconContainer}>
                                            <LinearGradient
                                                colors={['#1a1a1a', '#3f3f3f']}
                                                style={styles.iconGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <Feather name={feature.icon as any} size={22} color="#ffffff" />
                                            </LinearGradient>
                                        </View>
                                        <View style={styles.featureTextWrapper}>
                                            <TextMalet style={styles.featureTitle}>
                                                {feature.title}
                                            </TextMalet>
                                            <TextMalet style={styles.featureDescription}>
                                                {feature.description}
                                            </TextMalet>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.footerBrand}>
                                <TextMalet style={styles.footerBrandLight}>from</TextMalet>
                                <TextMalet style={styles.footerBrandBold}>Breadriuss</TextMalet>
                            </View>
                        </ScrollView>

                        <View style={styles.bottomSection}>
                            <LinearGradient
                                colors={['rgba(241, 245, 249, 0)', 'rgba(241, 245, 249, 1)']}
                                style={styles.bottomGradientCover}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                            />
                            <Button
                                text="Continuar"
                                onPress={handleDismiss}
                                style={styles.continueButton}
                            />
                        </View>
                    </SafeAreaView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
        overflow: 'hidden',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 120, // Space for fixed bottom button
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 24,
    },
    badgeContainer: {
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
    },
    featuresContainer: {
        gap: 32,
        marginBottom: 40,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    iconGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTextWrapper: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 15,
        color: '#64748b',
        lineHeight: 22,
    },
    footerBrand: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
        opacity: 0.8,
    },
    footerBrandLight: {
        color: '#94a3b8',
        fontSize: 12,
    },
    footerBrandBold: {
        color: '#334155',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
        marginTop: 2,
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: spacing.xlarge,
        paddingTop: 30,
    },
    bottomGradientCover: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    continueButton: {
        width: '100%',
        height: 54,
        borderRadius: 14,
    }
});
