import TextMalet from '@/components/TextMalet/TextMalet';
import { GarzonCredentials } from '@/shared/interfaces/garzon.interfaces';
import IconAt from '@/svgs/dashboard/IconAt';
import React, { memo, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    View
} from 'react-native';
import Button from '../Button/Button';
import Input from '../Input/Input';

interface GarzonLoginFormProps {
    onLogin: (credentials: GarzonCredentials) => Promise<boolean>;
    isLoading: boolean;
    error: string | null;
}

const GarzonLoginForm = memo(({ onLogin, isLoading, error }: GarzonLoginFormProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        if (!username.trim() || !password.trim()) return;
        await onLogin({ username, password });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                {/* Logo/Icon */}
                <View style={styles.logoContainer}>
                    <IconAt width={50} height={50} />
                    <View style={{ backgroundColor: 'rgba(245, 203, 66, 0.11)', borderRadius: 12, padding: 2 }}>
                        <Image source={require('@/assets/images/garzon/logo_reduced_garzon.png')}
                            style={{ width: 50, height: 50, objectFit: 'contain' }} />
                    </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <TextMalet style={styles.infoTitle}>Conecta tu cuenta</TextMalet>
                    <TextMalet style={styles.infoDescription}>
                        Ingresa tus credenciales del sistema Garzón para acceder al dashboard de ventas,
                        métodos de pago y productos más vendidos.
                    </TextMalet>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <TextMalet style={styles.label}>Nombre de usuario</TextMalet>
                        <Input
                            placeholder="tu nombre de usuario..."
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoComplete="username"
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextMalet style={styles.label}>Contraseña</TextMalet>
                        <Input
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password"
                            editable={!isLoading}
                        />
                    </View>

                    {error && (
                        <View style={styles.errorContainer}>
                            <TextMalet style={styles.errorText}>{error}</TextMalet>
                        </View>
                    )}

                    <Button
                        text='Iniciar sesión'
                        onPress={handleSubmit}
                        disabled={isLoading || !username.trim() || !password.trim()}
                    />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <TextMalet style={styles.footerText}>
                        Al iniciar sesión, aceptas que tus datos serán consultados del sistema Garzón.
                    </TextMalet>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 24,
    },
    logoContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#D97706',
    },
    brandName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
    },
    brandSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    infoCard: {
        backgroundColor: '#F0F9FF',
        borderRadius: 5,
        padding: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#222222ff',
    },
    infoTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0C4A6E',
        marginBottom: 4,
    },
    infoDescription: {
        fontSize: 12,
        color: '#0369A1',
        lineHeight: 18,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        gap: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1F2937',
    },
    errorContainer: {
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        padding: 12,
    },
    errorText: {
        fontSize: 13,
        color: '#DC2626',
        textAlign: 'center',
    },
    submitButton: {
        backgroundColor: '#F59E0B',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#FCD34D',
        shadowOpacity: 0,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    footer: {
        paddingTop: 8,
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default GarzonLoginForm;
