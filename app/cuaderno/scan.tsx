import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import TextMalet from '@/components/TextMalet/TextMalet';
import { notify } from '@/components/cuaderno/format';

const PREFIX = 'malet:store-invite:';
/** Token base64url del contrato (43 caracteres), también acepta el payload completo. */
const TOKEN_RE = /^[A-Za-z0-9_-]{20,}$/;

function extractToken(raw: string): string | null {
    const data = raw.trim();
    if (data.startsWith(PREFIX)) return data.slice(PREFIX.length);
    if (TOKEN_RE.test(data)) return data;
    return null;
}

/**
 * Escáner QR de invitaciones: detecta el prefijo `malet:store-invite:`
 * (o un token pelado) y abre la pantalla de consentimiento.
 */
export default function ScanInviteScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [manualOpen, setManualOpen] = useState(false);
    const [manualValue, setManualValue] = useState('');

    const goToConsent = (token: string) => {
        if (scanned) return;
        setScanned(true);
        router.replace({ pathname: '/cuaderno/invite-consent', params: { token } } as any);
    };

    const onScanned = ({ data }: { data: string }) => {
        const token = extractToken(data);
        if (token) goToConsent(token);
        // Códigos ajenos se ignoran y la cámara sigue activa.
    };

    const submitManual = () => {
        const token = extractToken(manualValue);
        if (!token) {
            notify('error', 'Ese código no parece una invitación válida de Malet.');
            return;
        }
        goToConsent(token);
    };

    if (!permission) {
        return (
            <View style={styles.center}>
                <TextMalet style={styles.infoText}>Preparando la cámara…</TextMalet>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <TextMalet style={styles.title}>Acceso a la cámara</TextMalet>
                <TextMalet style={styles.infoText}>
                    Necesitamos la cámara para escanear el código QR de invitación a la tienda.
                </TextMalet>
                <Button text="Otorgar permiso" onPress={requestPermission} style={styles.primaryBtn} />

                <TouchableOpacity onPress={() => setManualOpen((v) => !v)} style={styles.manualToggle}>
                    <TextMalet style={styles.manualToggleText}>
                        {manualOpen ? 'Ocultar ingreso manual' : '¿No tienes cámara a la mano? Ingresar código'}
                    </TextMalet>
                </TouchableOpacity>

                {manualOpen && (
                    <View style={styles.manualBox}>
                        <InputField
                            label="Código de invitación"
                            placeholder="Pega el token o malet:store-invite:..."
                            value={manualValue}
                            onChangeText={setManualValue}
                            autoCapitalize="none"
                        />
                        <Button text="Continuar" onPress={submitManual} />
                    </View>
                )}

                <TouchableOpacity onPress={() => router.back()} style={styles.backLink} hitSlop={10}>
                    <ChevronLeft size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => Linking.openSettings()}
                    style={styles.settingsLink}
                >
                    <TextMalet style={styles.manualToggleText}>Abrir ajustes de la app</TextMalet>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.cameraWrap}>
            <CameraView
                style={StyleSheet.absoluteFill}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : onScanned}
            />

            {/* Overlay con ventana de escaneo */}
            <View style={styles.overlay} pointerEvents="box-none">
                <TouchableOpacity onPress={() => router.back()} style={styles.backFloating} hitSlop={10}>
                    <ChevronLeft size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.frame}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                </View>

                <TextMalet style={styles.frameHint}>
                    Apunta al código QR de invitación de la tienda
                </TextMalet>

                <TouchableOpacity
                    onPress={() => setManualOpen((v) => !v)}
                    style={styles.manualToggleDark}
                >
                    <TextMalet style={styles.manualToggleDarkText}>
                        {manualOpen ? 'Ocultar ingreso manual' : 'Ingresar código manualmente'}
                    </TextMalet>
                </TouchableOpacity>

                {manualOpen && (
                    <View style={styles.manualBoxDark}>
                        <InputField
                            label="Código de invitación"
                            placeholder="Pega el token o malet:store-invite:..."
                            value={manualValue}
                            onChangeText={setManualValue}
                            autoCapitalize="none"
                        />
                        <Button text="Continuar" onPress={submitManual} />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        gap: 14,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
    },
    infoText: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        lineHeight: 20,
    },
    primaryBtn: {
        paddingHorizontal: 24,
    },
    manualToggle: {
        marginTop: 6,
        padding: 6,
    },
    manualToggleText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '600',
        textAlign: 'center',
        textDecorationLine: 'underline',
    },
    manualBox: {
        width: '100%',
        gap: 10,
    },
    backLink: {
        marginTop: 8,
        padding: 6,
    },
    settingsLink: {
        padding: 6,
    },
    cameraWrap: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 18,
    },
    backFloating: {
        position: 'absolute',
        top: 54,
        left: 18,
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    frame: {
        width: 240,
        height: 240,
        borderRadius: 24,
        backgroundColor: 'transparent',
    },
    corner: {
        position: 'absolute',
        width: 34,
        height: 34,
        borderColor: '#fff',
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 24,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 24,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 24,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 24,
    },
    frameHint: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        textAlign: 'center',
    },
    manualToggleDark: {
        padding: 8,
        marginTop: 6,
    },
    manualToggleDarkText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    manualBoxDark: {
        width: '100%',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 16,
        padding: 14,
    },
});
