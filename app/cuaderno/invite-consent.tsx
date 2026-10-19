import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '@/components/Button/Button';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import { notify, secondsUntil } from '@/components/cuaderno/format';
import { ConsentSkeleton } from '@/components/cuaderno/Skeletons';
import { StoreInviteInfo } from '@/shared/entities/SalesModule';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';

/**
 * Pantalla de consentimiento de la invitación (tras escanear el QR):
 * "X te invita a su tienda" → Aceptar o Rechazar.
 * Rechazar no llama a ningún endpoint: el token simplemente expira.
 */
export default function InviteConsentScreen() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const fetchInviteInfo = useSalesModuleStore((s) => s.fetchInviteInfo);
    const acceptInvite = useSalesModuleStore((s) => s.acceptInvite);
    const loadStores = useSalesModuleStore((s) => s.loadStores);

    const [info, setInfo] = useState<StoreInviteInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [accepting, setAccepting] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!token) {
                setErrorMsg('Falta el código de invitación.');
                setLoading(false);
                return;
            }
            const res = await fetchInviteInfo(token);
            if (!mounted) return;
            if (res.error || !res.info) {
                setErrorMsg(res.error ?? 'Invitación no válida.');
                setLoading(false);
                return;
            }
            setInfo(res.info);
            setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, [token, fetchInviteInfo]);

    useEffect(() => {
        if (!info) return;
        const update = () => setSecondsLeft(secondsUntil(info.expires_at));
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [info]);

    const handleAccept = async () => {
        if (!token) return;
        setAccepting(true);
        const res = await acceptInvite(token);
        setAccepting(false);
        if (!res.ok) {
            notify('error', res.error ?? 'No se pudo aceptar la invitación.');
            return;
        }
        await loadStores({ refresh: true });
        notify('success', `Te uniste a ${info?.store?.name ?? 'la tienda'}.`);
        router.replace('/cuaderno' as any);
    };

    const handleReject = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/cuaderno' as any);
    };

    if (loading) {
        return (
            <LayoutAuthenticated>
                <ConsentSkeleton />
            </LayoutAuthenticated>
        );
    }

    if (errorMsg || !info) {
        return (
            <LayoutAuthenticated>
                <View style={styles.center}>
                    <TextMalet style={styles.errorTitle}>Invitación no disponible</TextMalet>
                    <TextMalet style={styles.infoText}>
                        {errorMsg ?? 'Esta invitación ya no es válida.'}
                    </TextMalet>
                    <Button text="Volver" onPress={handleReject} style={styles.primaryBtn} />
                </View>
            </LayoutAuthenticated>
        );
    }

    const urgent = secondsLeft <= 15;

    return (
        <LayoutAuthenticated>
            <View style={styles.center}>
                <View style={styles.avatar}>
                    <TextMalet style={styles.avatarText}>
                        {info.inviter.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </TextMalet>
                </View>

                <TextMalet style={styles.inviterLine}>
                    <TextMalet style={styles.inviterName}>{info.inviter.name}</TextMalet> te invita
                    a unirte a
                </TextMalet>

                <TextMalet style={styles.storeName}>{info.store.name}</TextMalet>

                <View style={[styles.expiryBadge, urgent && styles.expiryBadgeUrgent]}>
                    <TextMalet style={[styles.expiryText, urgent && styles.expiryTextUrgent]}>
                        Expira en {secondsLeft}s
                    </TextMalet>
                </View>

                <View style={styles.actions}>
                    <Button
                        text="Aceptar invitación"
                        onPress={handleAccept}
                        loading={accepting}
                        style={styles.primaryBtn}
                    />
                    <Button
                        text="Rechazar"
                        onPress={handleReject}
                        style={styles.rejectBtn}
                        labelStyle={styles.rejectLabel}
                    />
                </View>

                <TextMalet style={styles.hint}>
                    Al aceptar te conviertes en miembro activo de la tienda y el código se consume
                    (uso único).
                </TextMalet>
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 12,
    },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
    },
    inviterLine: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
    },
    inviterName: {
        fontWeight: '700',
        color: '#111',
    },
    storeName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    expiryBadge: {
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.25)',
        marginTop: 2,
    },
    expiryBadgeUrgent: {
        backgroundColor: '#fffbeb',
        borderColor: 'rgba(245,158,11,0.35)',
    },
    expiryText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#16a34a',
    },
    expiryTextUrgent: {
        color: '#b45309',
    },
    actions: {
        width: '100%',
        gap: 10,
        marginTop: 22,
    },
    primaryBtn: {
        width: '100%',
    },
    rejectBtn: {
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.15)',
    },
    rejectLabel: {
        color: '#555',
    },
    hint: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.4)',
        textAlign: 'center',
        lineHeight: 17,
        marginTop: 8,
        paddingHorizontal: 10,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
    },
    infoText: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        lineHeight: 20,
    },
});
