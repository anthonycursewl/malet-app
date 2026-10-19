import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '@/components/Button/Button';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import CuadernoHeader from '@/components/cuaderno/CuadernoHeader';
import { notify, secondsUntil } from '@/components/cuaderno/format';
import { QrSkeleton } from '@/components/cuaderno/Skeletons';
import { StoreInvite, storePhotoUrl } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

/** Rotación automática del QR: por debajo del TTL de 60 s del backend. */
const ROTATION_MS = 45000;

/**
 * Pantalla del dueño: genera el QR de invitación (TTL 60 s), lo rota
 * automáticamente cada ~45 s como WhatsApp Web y permite revocarlo.
 */
export default function StoreInviteScreen() {
    const { store: storeId } = useLocalSearchParams<{ store: string }>();
    const currentStore = useSalesModuleStore((s) => s.currentStore);
    const generateInvite = useSalesModuleStore((s) => s.generateInvite);
    const revokeInvite = useSalesModuleStore((s) => s.revokeInvite);

    const [invite, setInvite] = useState<StoreInvite | null>(null);
    const [busy, setBusy] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(0);

    const generate = useCallback(async () => {
        if (!storeId) return;
        setBusy(true);
        setErrorMsg(null);
        const { invite: newInvite, error } = await generateInvite(storeId);
        setBusy(false);
        if (error || !newInvite) {
            setErrorMsg(error ?? 'No se pudo generar la invitación.');
            return;
        }
        setInvite(newInvite);
        setSecondsLeft(secondsUntil(newInvite.expires_at));
    }, [storeId, generateInvite]);

    // Generar al abrir
    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!storeId) return;
            const res = await generateInvite(storeId);
            if (!mounted) return;
            setBusy(false);
            if (res.error || !res.invite) {
                setErrorMsg(res.error ?? 'No se pudo generar la invitación.');
                return;
            }
            setInvite(res.invite);
            setSecondsLeft(secondsUntil(res.invite.expires_at));
        })();
        return () => {
            mounted = false;
        };
    }, [storeId, generateInvite]);

    // Conteo regresivo de vigencia (el valor inicial se calcula al generar)
    useEffect(() => {
        if (!invite) return;
        const timer = setInterval(() => setSecondsLeft(secondsUntil(invite.expires_at)), 1000);
        return () => clearInterval(timer);
    }, [invite]);

    // Rotación automática (cada rotación revoca los códigos anteriores)
    useEffect(() => {
        if (!invite) return;
        const timer = setInterval(() => {
            generate();
        }, ROTATION_MS);
        return () => clearInterval(timer);
    }, [invite, generate]);

    const handleRevoke = async () => {
        if (!storeId) return;
        setBusy(true);
        const err = await revokeInvite(storeId);
        setBusy(false);
        if (err) {
            notify('error', err);
            return;
        }
        setInvite(null);
        notify('info', 'Código revocado.');
    };

    const urgent = invite != null && secondsLeft <= 15;

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <CuadernoHeader
                    title="Invitar con QR"
                    subtitle={`${currentStore?.name ?? 'Tu tienda'} · Solo el dueño puede generar invitaciones`}
                    photo={storePhotoUrl(currentStore, 'avatar', 'medium')}
                    style={styles.headerSpacing}
                />

                <View style={styles.qrCard}>
                    {busy && !invite ? (
                        <QrSkeleton />
                    ) : invite ? (
                        <>
                            <QRCode
                                value={invite.qr_payload}
                                size={230}
                                backgroundColor="white"
                                color="#000"
                            />
                            <View style={styles.expiryBadge}>
                                <View
                                    style={[
                                        styles.expiryDot,
                                        { backgroundColor: urgent ? '#f59e0b' : '#16a34a' },
                                    ]}
                                />
                                <TextMalet
                                    style={[styles.expiryText, urgent && styles.expiryTextUrgent]}
                                >
                                    Expira en {secondsLeft}s · se renueva solo
                                </TextMalet>
                            </View>
                        </>
                    ) : (
                        <View style={styles.revokedBox}>
                            <TextMalet style={styles.revokedTitle}>Código revocado</TextMalet>
                            <TextMalet style={styles.revokedText}>
                                Genera uno nuevo para poder invitar.
                            </TextMalet>
                        </View>
                    )}
                </View>

                {errorMsg && <TextMalet style={styles.error}>{errorMsg}</TextMalet>}

                <TextMalet style={styles.hint}>
                    La otra persona abre “Escanear QR” en Malet Sales, apunta a este código
                    y acepta la invitación. Cada rotación invalida los códigos anteriores.
                </TextMalet>

                <View style={styles.actions}>
                    <Button
                        text={invite ? 'Rotar ahora' : 'Generar código'}
                        onPress={generate}
                        loading={busy}
                        style={styles.actionBtn}
                    />
                    {invite && (
                        <Button
                            text="Revocar código"
                            onPress={handleRevoke}
                            style={styles.revokeBtn}
                            labelStyle={styles.revokeLabel}
                        />
                    )}
                </View>
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 4,
    },
    headerSpacing: {
        marginBottom: 10,
    },
    qrCard: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 20,
        paddingVertical: 26,
        paddingHorizontal: 20,
        gap: 16,
        minHeight: 300,
    },
    expiryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: '#f4f4f5',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    expiryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    expiryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#444',
    },
    expiryTextUrgent: {
        color: '#b45309',
    },
    revokedBox: {
        alignItems: 'center',
        gap: 6,
        paddingVertical: 30,
    },
    revokedTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    revokedText: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
    },
    error: {
        fontSize: 13,
        color: '#dc2626',
        textAlign: 'center',
        marginTop: 12,
    },
    hint: {
        fontSize: 12.5,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 18,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 10,
    },
    actions: {
        gap: 10,
        marginTop: 18,
    },
    actionBtn: {
        width: '100%',
    },
    revokeBtn: {
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.35)',
    },
    revokeLabel: {
        color: '#dc2626',
    },
});
