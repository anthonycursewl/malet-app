import * as ImgPicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import TextMalet from '@/components/TextMalet/TextMalet';
import {
    STORE_PHOTO_ASPECT,
    STORE_PHOTO_UPLOAD_WIDTH,
    StorePhotoKind,
    storePhotoUrl,
} from '@/shared/entities/SalesModule';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { notify } from './format';

/**
 * Acota la imagen antes de subirla (el backend genera las 3 resoluciones a
 * partir de ella). Nunca agranda una imagen que ya es más pequeña.
 */
async function preparePhoto(
    uri: string,
    sourceWidth: number | undefined,
    maxWidth: number
) {
    const context = ImageManipulator.manipulate(uri);
    if (sourceWidth && sourceWidth > maxWidth) {
        context.resize({ width: maxWidth });
    }

    const image = await context.renderAsync();
    const saved = await image.saveAsync({
        compress: 0.82,
        format: SaveFormat.JPEG,
    });

    return {
        uri: saved.uri,
        name: `store-photo-${Date.now()}.jpg`,
        type: 'image/jpeg',
    };
}

/**
 * Foto de perfil y banner de la tienda: el dueño elige la imagen, la app la
 * acota y el servidor genera las 3 resoluciones (small/medium/large).
 * Tocar el preview abre la foto en grande (resolución `large`).
 */
export default function StorePhotosCard() {
    const user = useAuthStore((s) => s.user);
    const currentStore = useSalesModuleStore((s) => s.currentStore);
    const uploadStorePhoto = useSalesModuleStore((s) => s.uploadStorePhoto);

    /** Foto que se está subiendo (para el overlay de progreso). */
    const [busy, setBusy] = useState<StorePhotoKind | null>(null);
    const [progress, setProgress] = useState(0);
    /** Foto abierta a pantalla completa. */
    const [viewer, setViewer] = useState<StorePhotoKind | null>(null);
    /** Imágenes que no cargaron (sin conexión o archivo ya borrado). */
    const [failed, setFailed] = useState({ avatar: false, banner: false });

    const isOwner = currentStore?.user_id === user?.id;
    const avatarUrl = failed.avatar
        ? null
        : storePhotoUrl(currentStore, 'avatar', 'medium');
    const bannerUrl = failed.banner
        ? null
        : storePhotoUrl(currentStore, 'banner', 'medium');
    const viewerUrl = viewer ? storePhotoUrl(currentStore, viewer, 'large') : null;

    const markFailed = (kind: StorePhotoKind) =>
        setFailed((prev) => ({ ...prev, [kind]: true }));

    const pickPhoto = async (kind: StorePhotoKind) => {
        if (!isOwner) {
            notify('error', 'Solo el dueño de la tienda puede cambiar las fotos.');
            return;
        }

        const permission = await ImgPicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                'Malet | Error',
                'Tienes que proporcionar permisos para ver la galeria.'
            );
            return;
        }

        const result = await ImgPicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: STORE_PHOTO_ASPECT[kind],
            quality: 1,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];
        setBusy(kind);
        setProgress(0);

        try {
            const file = await preparePhoto(
                asset.uri,
                asset.width,
                STORE_PHOTO_UPLOAD_WIDTH[kind]
            );

            const error = await uploadStorePhoto(kind, file, setProgress);
            if (error) {
                notify('error', error);
                return;
            }

            // La foto nueva debe mostrarse aunque la anterior hubiera fallado.
            setFailed((prev) => ({ ...prev, [kind]: false }));

            notify(
                'success',
                kind === 'avatar'
                    ? 'Foto de la tienda actualizada.'
                    : 'Banner actualizado.'
            );
        } catch {
            notify('error', 'No se pudo procesar la imagen.');
        } finally {
            setBusy(null);
            setProgress(0);
        }
    };

    if (!currentStore) return null;

    return (
        <View style={styles.card}>
            <View style={styles.preview}>
                {bannerUrl ? (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setViewer('banner')}
                        disabled={busy !== null}
                    >
                        <Image
                            source={{ uri: bannerUrl }}
                            style={styles.banner}
                            resizeMode="cover"
                            onError={() => markFailed('banner')}
                        />
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.banner, styles.bannerFallback]}>
                        <TextMalet style={styles.bannerHint}>Sin banner</TextMalet>
                    </View>
                )}

                <View style={styles.avatarWrap}>
                    {avatarUrl ? (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => setViewer('avatar')}
                            disabled={busy !== null}
                        >
                            <Image
                                source={{ uri: avatarUrl }}
                                style={styles.avatar}
                                resizeMode="cover"
                                onError={() => markFailed('avatar')}
                            />
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.avatar, styles.avatarFallback]}>
                            <TextMalet style={styles.avatarText}>
                                {(currentStore.name ?? '?').charAt(0).toUpperCase()}
                            </TextMalet>
                        </View>
                    )}
                </View>

                {busy && (
                    <View style={styles.overlay}>
                        <ActivityIndicator color="#fff" />
                        <TextMalet style={styles.overlayText}>
                            {progress > 0
                                ? `Subiendo… ${Math.round(progress * 100)}%`
                                : 'Optimizando…'}
                        </TextMalet>
                    </View>
                )}
            </View>

            <TextMalet style={styles.title}>Foto y banner</TextMalet>
            <TextMalet style={styles.subtitle}>
                Se usan en la lista de tiendas y en el panel. El servidor genera las
                resoluciones: 96/256/512 px para la foto y 480/960/1600 px para el banner.
            </TextMalet>

            {isOwner ? (
                <View style={styles.actions}>
                    <Button
                        text={avatarUrl ? 'Cambiar foto' : 'Añadir foto'}
                        onPress={() => pickPhoto('avatar')}
                        disabled={busy !== null}
                        style={styles.action}
                    />
                    <Button
                        text={bannerUrl ? 'Cambiar banner' : 'Añadir banner'}
                        onPress={() => pickPhoto('banner')}
                        disabled={busy !== null}
                        style={styles.action}
                    />
                </View>
            ) : (
                <TextMalet style={styles.hint}>
                    Solo el dueño de la tienda puede cambiar las fotos.
                </TextMalet>
            )}

            <Modal
                visible={viewer !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setViewer(null)}
                statusBarTranslucent
            >
                <Pressable style={styles.viewerBackdrop} onPress={() => setViewer(null)}>
                    {viewerUrl ? (
                        <Image
                            source={{ uri: viewerUrl }}
                            style={[
                                styles.viewerImage,
                                viewer === 'avatar' ? styles.viewerSquare : null,
                            ]}
                            resizeMode="contain"
                            onError={() => setViewer(null)}
                        />
                    ) : null}
                    <TextMalet style={styles.viewerHint}>Toca para cerrar</TextMalet>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 14,
        gap: 6,
    },
    preview: {
        marginHorizontal: -14,
        marginTop: -14,
        marginBottom: 8,
        // Espacio reservado para el avatar que sobresale por debajo del banner.
        paddingBottom: 26,
    },
    banner: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#eef0f3',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    bannerFallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerHint: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.3)',
        fontWeight: '600',
    },
    avatarWrap: {
        position: 'absolute',
        left: 14,
        bottom: 0,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: '#fff',
        backgroundColor: '#f0f0f2',
    },
    avatarFallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    overlayText: {
        color: '#fff',
        fontSize: 12.5,
        fontWeight: '600',
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    action: {
        alignSelf: 'flex-start',
    },
    hint: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 8,
        lineHeight: 16,
    },
    viewerBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 18,
    },
    viewerImage: {
        width: '100%',
        height: '62%',
    },
    viewerSquare: {
        width: '72%',
        height: undefined,
        aspectRatio: 1,
    },
    viewerHint: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12.5,
        fontWeight: '600',
    },
});
