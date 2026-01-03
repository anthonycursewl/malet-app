import Button from "@/components/Button/Button";
import { VERIFICATION_TYPES } from "@/components/DashboardHeader";
import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import TextMalet from "@/components/TextMalet/TextMalet";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import { spacing } from "@/shared/theme";
import IconAbout from "@/svgs/common/IconAbout";
import IconHelp from "@/svgs/common/IconHelp";
import IconLink from "@/svgs/common/IconLink";
import IconNotification from "@/svgs/common/IconNotification";
import IconPeople from "@/svgs/common/IconPeople";
import IconSecurity from "@/svgs/common/IconSecurity";
import IconSettings from "@/svgs/common/IconSettings";
import IconVerified from "@/svgs/common/IconVerified";
import IconAt from "@/svgs/dashboard/IconAt";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";

interface ProfileOptionProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showBorder?: boolean;
    danger?: boolean;
}

const ProfileOption = ({ icon, title, subtitle, onPress, showBorder = true, danger = false }: ProfileOptionProps) => (
    <TouchableOpacity
        style={[styles.optionContainer, !showBorder && styles.noBorder]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.optionLeft}>
            <View style={[styles.iconContainer, danger && styles.dangerIconContainer]}>
                {icon}
            </View>
            <View style={styles.optionTextContainer}>
                <TextMalet style={[styles.optionTitle, danger && styles.dangerText]}>
                    {title}
                </TextMalet>
                {subtitle && (
                    <TextMalet style={styles.optionSubtitle}>
                        {subtitle}
                    </TextMalet>
                )}
            </View>
        </View>
        <TextMalet style={styles.optionArrow}>›</TextMalet>
    </TouchableOpacity>
);

export default function ProfileView() {
    const { user, logout } = useAuthStore();
    const { logoutAccount } = useAccountStore()
    const { logoutWallet } = useWalletStore()

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogoutApp = useCallback(async () => {
        setIsLoggingOut(true);
        logoutAccount();
        logoutWallet();
        logout();
        router.replace('/');
    }, [logout, logoutAccount, logoutWallet]);

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que deseas cerrar sesión?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoggingOut(true);
                        await handleLogoutApp();
                        setIsLoggingOut(false);
                        router.replace('/');
                    }
                }
            ]
        );
    };

    const handleEditProfile = () => {
        router.push('/profile/edit')
    };

    const handleSettings = () => {
        Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
    };

    const handleSecurity = () => {
        Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
    };

    const handleNotifications = () => {
        Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
    };

    const handleHelp = () => {
        Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
    };

    const handleAbout = () => {
        Alert.alert('Próximamente', 'Esta función estará disponible pronto.');
    };

    const handleIntegrations = () => {
        router.push('/profile/integrations');
    };

    const verificationType = user?.verification_type?.type;
    const verificationTypeColor = verificationType ? VERIFICATION_TYPES[verificationType]?.color : undefined;

    return (
        <LayoutAuthenticated>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <TextMalet style={styles.backText}>←</TextMalet>
                        <TextMalet style={styles.backText}>Volver</TextMalet>
                    </TouchableOpacity>

                    <TextMalet style={styles.headerTitle}>Perfil</TextMalet>
                </View>

                {/* User Info Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        <IconAt width={40} height={40} fill="#161616ff" />
                    </View>
                    <View style={styles.userInfo}>
                        <View style={styles.nameContainer}>
                            <TextMalet style={styles.userName}>{user?.name || 'Usuario'}</TextMalet>
                            {verificationTypeColor && (
                                <IconVerified width={20} height={20} fill={verificationTypeColor} />
                            )}
                        </View>
                        <TextMalet style={styles.userEmail}>{user?.email || 'email@example.com'}</TextMalet>
                    </View>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <TextMalet style={styles.sectionTitle}>Cuenta</TextMalet>
                    <View style={styles.optionsGroup}>
                        <ProfileOption
                            icon={<IconPeople width={25} height={25} fill="#161616ff" />}
                            title="Editar perfil"
                            subtitle="Actualiza tu información personal"
                            onPress={handleEditProfile}
                        />
                        <ProfileOption
                            icon={<IconSettings width={25} height={25} fill="#161616ff" />}
                            title="Configuración"
                            subtitle="Preferencias de la aplicación"
                            onPress={handleSettings}
                        />
                        <ProfileOption
                            icon={<IconSecurity width={25} height={25} fill="#161616ff" />}
                            title="Seguridad"
                            subtitle="Contraseña y autenticación"
                            onPress={handleSecurity}
                            showBorder={false}
                        />
                    </View>
                </View>

                {/* Integrations Section */}
                <View style={styles.section}>
                    <TextMalet style={styles.sectionTitle}>Integraciones</TextMalet>
                    <View style={styles.optionsGroup}>
                        <ProfileOption
                            icon={<IconLink width={25} height={25} fill="#161616ff" />}
                            title="Aplicaciones conectadas"
                            subtitle="Conecta Malet con servicios de terceros"
                            onPress={handleIntegrations}
                            showBorder={false}
                        />
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <TextMalet style={styles.sectionTitle}>Preferencias</TextMalet>
                    <View style={styles.optionsGroup}>
                        <ProfileOption
                            icon={<IconNotification width={25} height={25} fill="#161616ff" />}
                            title="Notificaciones"
                            subtitle="Gestiona tus notificaciones"
                            onPress={handleNotifications}
                            showBorder={false}
                        />
                    </View>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <TextMalet style={styles.sectionTitle}>Soporte</TextMalet>
                    <View style={styles.optionsGroup}>
                        <ProfileOption
                            icon={<IconHelp width={25} height={25} fill="#161616ff" />}
                            title="Ayuda"
                            subtitle="Centro de ayuda y FAQs"
                            onPress={handleHelp}
                        />
                        <ProfileOption
                            icon={<IconAbout width={25} height={25} fill="#161616ff" />}
                            title="Acerca de"
                            subtitle="Versión y términos de uso"
                            onPress={handleAbout}
                            showBorder={false}
                        />
                    </View>
                </View>

                {/* Logout Button */}
                <View style={styles.logoutSection}>
                    <Button
                        text={isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                        onPress={handleLogout}
                        loading={isLoggingOut}
                    />
                </View>

                {/* App Version */}
                <TextMalet style={styles.versionText}>Versión 1.0.0</TextMalet>
                <TextMalet style={[styles.versionText, { fontStyle: 'italic', marginBottom: spacing.xlarge }]}>Powered by Breadriuss | Malet App</TextMalet>
            </ScrollView>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        marginTop: 10,
        marginBottom: 20,
    },
    backButton: {
        marginBottom: 12,
        gap: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: spacing.medium,
        marginBottom: spacing.large,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    avatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.medium - 4,
    },
    userInfo: {
        flex: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    userEmail: {
        fontSize: 12,
        color: '#666',
    },
    section: {
        marginBottom: spacing.large,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: spacing.small,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    optionsGroup: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    dangerIconContainer: {
        backgroundColor: 'transparent',
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    dangerText: {
        color: '#dc3545',
    },
    optionSubtitle: {
        fontSize: 11,
        color: '#666',
    },
    optionIcon: {
        fontSize: 16,
    },
    optionArrow: {
        fontSize: 20,
        color: '#ccc',
        fontWeight: '300',
    },
    logoutSection: {
        marginTop: spacing.medium,
        marginBottom: spacing.large,
    },
    logoutButton: {
        backgroundColor: '#dc3545',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#999',
    },
});
