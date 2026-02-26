import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import TextMalet from "@/components/TextMalet/TextMalet";
import { VERIFICATION_TYPES } from "@/shared/constants/VERIFICATION_DETAILS";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import { spacing } from "@/shared/theme";
import IconVerified from "@/svgs/common/IconVerified";
import IconAt from "@/svgs/dashboard/IconAt";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

type OptionTone = "default" | "danger" | "muted";

interface OptionBlockProps {
    icon: React.ComponentProps<typeof Feather>["name"];
    title: string;
    subtitle: string;
    onPress: () => void;
    tone?: OptionTone;
    tag?: string;
    disabled?: boolean;
}

const OptionBlock = ({
    icon,
    title,
    subtitle,
    onPress,
    tone = "default",
    tag,
    disabled = false,
}: OptionBlockProps) => {
    const iconColor = tone === "danger" ? "#b91c1c" : tone === "muted" ? "#64748b" : "#0f172a";

    return (
        <TouchableOpacity
            style={[
                styles.optionBlock,
                disabled && styles.optionBlockDisabled,
                tone === "danger" && styles.optionBlockDanger,
            ]}
            activeOpacity={0.82}
            onPress={onPress}
            disabled={disabled}
        >
            <View style={styles.optionHeader}>
                <View style={styles.optionIconWrap}>
                    <Feather name={icon} size={17} color={iconColor} />
                </View>
                {!!tag && (
                    <View style={styles.optionTag}>
                        <TextMalet style={styles.optionTagText}>{tag}</TextMalet>
                    </View>
                )}
            </View>

            <TextMalet style={[styles.optionTitle, tone === "danger" && styles.optionTitleDanger]} numberOfLines={2}>
                {title}
            </TextMalet>
            <TextMalet style={styles.optionSubtitle} numberOfLines={2}>
                {subtitle}
            </TextMalet>
        </TouchableOpacity>
    );
};

export default function ProfileView() {
    const { user, logout } = useAuthStore();
    const { logoutAccount } = useAccountStore();
    const { logoutWallet } = useWalletStore();

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogoutApp = useCallback(async () => {
        setIsLoggingOut(true);
        await logoutAccount();
        await logoutWallet();
        await logout();
        setIsLoggingOut(false);
        router.replace("/");
    }, [logout, logoutAccount, logoutWallet]);

    const handleSoon = useCallback((name: string) => {
        Alert.alert("Proximamente", `${name} estara disponible pronto.`);
    }, []);

    const handleLogout = useCallback(() => {
        Alert.alert("Cerrar sesion", "Estas seguro de que deseas cerrar sesion?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Cerrar sesion",
                style: "destructive",
                onPress: () => {
                    handleLogoutApp();
                },
            },
        ]);
    }, [handleLogoutApp]);

    const verificationType = user?.verification_type?.type;
    const verificationTypeColor = verificationType ? VERIFICATION_TYPES[verificationType]?.color : undefined;

    const profileName = user?.name?.trim() || "Usuario";
    const username = user?.username?.trim() || "usuario";

    const options = useMemo(
        () => [
            {
                id: "edit",
                icon: "user" as const,
                title: "Editar perfil",
                subtitle: "Datos personales",
                onPress: () => router.push("/profile/edit"),
            },
            {
                id: "integrations",
                icon: "link-2" as const,
                title: "Integraciones",
                subtitle: "Apps conectadas",
                onPress: () => router.push("/profile/integrations"),
            },
            {
                id: "settings",
                icon: "settings" as const,
                title: "Configuracion",
                subtitle: "Preferencias de app",
                onPress: () => handleSoon("Configuracion"),
                tone: "muted" as OptionTone,
                tag: "Pronto",
            },
            {
                id: "security",
                icon: "shield" as const,
                title: "Seguridad",
                subtitle: "Sesion y acceso",
                onPress: () => handleSoon("Seguridad"),
                tone: "muted" as OptionTone,
                tag: "Pronto",
            },
            {
                id: "notifications",
                icon: "bell" as const,
                title: "Notificaciones",
                subtitle: "Avisos y alertas",
                onPress: () => handleSoon("Notificaciones"),
                tone: "muted" as OptionTone,
                tag: "Pronto",
            },
            {
                id: "help",
                icon: "help-circle" as const,
                title: "Ayuda",
                subtitle: "Soporte y preguntas",
                onPress: () => handleSoon("Ayuda"),
                tone: "muted" as OptionTone,
            },
            {
                id: "about",
                icon: "info" as const,
                title: "Acerca de",
                subtitle: "Version y terminos",
                onPress: () => handleSoon("Acerca de"),
                tone: "muted" as OptionTone,
            },
            {
                id: "logout",
                icon: "log-out" as const,
                title: isLoggingOut ? "Cerrando sesion" : "Cerrar sesion",
                subtitle: "Salir de tu cuenta",
                onPress: handleLogout,
                tone: "danger" as OptionTone,
                disabled: isLoggingOut,
            },
        ],
        [handleLogout, handleSoon, isLoggingOut]
    );

    return (
        <LayoutAuthenticated>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <View style={styles.banner}>
                        {user?.banner_url ? (
                            <Image
                                source={{ uri: user.banner_url }}
                                style={[styles.bannerImage]}
                                resizeMode="cover"
                            />
                        ) : (
                            <LinearGradient
                                colors={["#7ea5da", "#5baafa"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                        )}
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Feather name="arrow-left" size={16} color="#0f172a" />
                            <TextMalet style={styles.backText}>Volver</TextMalet>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.identityRow}>
                        <View style={styles.avatarRing}>
                            {user?.avatar_url ? (
                                <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} resizeMode="cover" />
                            ) : (
                                <IconAt width={32} height={32} fill="#0f172a" />
                            )}
                        </View>

                        <View style={styles.identityTextWrap}>
                            <View style={styles.nameRow}>
                                <TextMalet style={styles.profileName}>{profileName}</TextMalet>
                                {verificationTypeColor && <IconVerified width={18} height={18} fill={verificationTypeColor} />}
                            </View>
                            <TextMalet style={styles.usernameText}>@{username}</TextMalet>
                        </View>
                    </View>
                </View>

                <View style={styles.optionsSection}>
                    <TextMalet style={styles.sectionTitle}>Opciones</TextMalet>
                    <View style={styles.optionsGrid}>
                        {options.map((option) => (
                            <OptionBlock
                                key={option.id}
                                icon={option.icon}
                                title={option.title}
                                subtitle={option.subtitle}
                                onPress={option.onPress}
                                tone={option.tone}
                                tag={option.tag}
                                disabled={option.disabled}
                            />
                        ))}
                    </View>
                </View>

                <TextMalet style={styles.versionText}>Version 1.0.0</TextMalet>
                <TextMalet style={styles.poweredText}>Powered by Breadriuss | Malet App</TextMalet>
                <View style={{ height: spacing.xlarge }} />
            </ScrollView>

            {isLoggingOut && (
                <View style={styles.loggingOverlay}>
                    <ActivityIndicator size="small" color="#0f172a" />
                </View>
            )}
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
        paddingHorizontal: spacing.xsmall,
    },
    backButton: {
        position: "absolute",
        top: 10,
        left: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.75)",
        backgroundColor: "rgba(255,255,255,0.86)",
    },
    backText: {
        fontSize: 13,
        color: "#334155",
        fontWeight: "600",
    },
    hero: {
        marginHorizontal: -spacing.xsmall,
        marginBottom: spacing.large,
    },
    banner: {
        width: "100%",
        aspectRatio: 2.1,
        minHeight: 150,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#f8fafc",
    },
    bannerImage: {
        ...StyleSheet.absoluteFillObject,
        width: "100%",
        height: "100%",
    },
    bannerImageFaded: {
        opacity: 0.4,
    },
    identityRow: {
        marginTop: -26,
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatarRing: {
        width: 74,
        height: 74,
        borderRadius: 37,
        borderWidth: 3,
        borderColor: "#ffffff",
        backgroundColor: "#f8fafc",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    identityTextWrap: {
        flex: 1,
        paddingTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "rgb(255, 255, 255)",
        borderRadius: 12,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginBottom: 1,
    },
    profileName: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "500",
        color: "#0f172a",
    },
    usernameText: {
        marginTop: 0,
        fontSize: 12,
        color: "#475569",
        fontWeight: "400",
    },
    optionsSection: {
        marginBottom: spacing.large,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: 0.6,
        marginBottom: spacing.small,
    },
    optionsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 8,
    },
    optionBlock: {
        width: "48.5%",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "transparent",
        paddingHorizontal: 10,
        paddingVertical: 9,
        minHeight: 108,
    },
    optionBlockDisabled: {
        opacity: 0.7,
    },
    optionBlockDanger: {
        borderColor: "#fecaca",
    },
    optionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    optionIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
    },
    optionTag: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    optionTagText: {
        fontSize: 10,
        color: "#64748b",
        fontWeight: "700",
    },
    optionTitle: {
        fontSize: 14,
        lineHeight: 18,
        color: "#0f172a",
        fontWeight: "700",
    },
    optionTitleDanger: {
        color: "#b91c1c",
    },
    optionSubtitle: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 16,
        color: "#64748b",
    },
    versionText: {
        textAlign: "center",
        fontSize: 12,
        color: "#94a3b8",
    },
    poweredText: {
        textAlign: "center",
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 3,
        fontStyle: "italic",
    },
    loggingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.25)",
    },
});
