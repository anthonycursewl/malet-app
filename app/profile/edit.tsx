import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import TextMalet from "@/components/TextMalet/TextMalet";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useProfileStore } from "@/shared/stores/useProfileStore";
import IconCross from "@/svgs/common/IconCross";
import IconVerified from "@/svgs/common/IconVerified";
import IconAt from "@/svgs/dashboard/IconAt";
import * as ImgPicker from 'expo-image-picker';
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageSourcePropType,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PLACEHOLDER_AVATAR = require("@/assets/images/placeholders/placeholder_avatar.png");
const PLACEHOLDER_BANNER = require("@/assets/images/placeholders/placeholder_banner.png");

export default function EditProfile() {
    const { user, setUser } = useAuthStore();
    const { loading: loadingUsername, error, checkUsernameAvailability, updateProfile } = useProfileStore()

    const [form, setForm] = useState({
        name: user?.name || "",
        username: user?.username || "",
        email: user?.email || "",
    });


    const [pickedImages, setPickedImages] = useState<{ banner: string | null, avatar: string | null }>({
        banner: null,
        avatar: null
    });

    const [isLoading, setIsLoading] = useState(false);
    const [usernameTaken, setUsernameTaken] = useState(false)

    const getBannerSource = (): ImageSourcePropType => {
        if (pickedImages.banner) return { uri: pickedImages.banner };
        if (user.banner_url) return { uri: user.banner_url };
        return PLACEHOLDER_BANNER;
    };

    const getAvatarSource = (): ImageSourcePropType => {
        if (pickedImages.avatar) return { uri: pickedImages.avatar };
        if (user.avatar_url) return { uri: user.avatar_url };
        return PLACEHOLDER_AVATAR;
    };
    // -----------------------------------------------------------

    const handleChange = (key: string, value: string) => {
        setForm({ ...form, [key]: value });
    };

    const handleChangeAvatar = async () => {
        const permissionResult = await ImgPicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) return Alert.alert('Malet | Error', 'Tienes que proporcionar permisos para ver la galeria.');

        let result = await ImgPicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPickedImages({ ...pickedImages, avatar: result.assets[0].uri });
        }
    };

    const handleChangeBanner = async () => {
        const permissionResult = await ImgPicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) return Alert.alert('Malet | Error', 'Tienes que proporcionar permisos para ver la galeria.');

        let result = await ImgPicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPickedImages({ ...pickedImages, banner: result.assets[0].uri });
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.username) {
            Alert.alert("Error", "El nombre y usuario no pueden estar vacíos.");
            return;
        }

        setIsLoading(true);
        try {
            const dataToUpdate = {
                ...form,
                newAvatar: pickedImages.avatar || undefined,
                newBanner: pickedImages.banner || undefined
            };

            const { error, response } = await updateProfile(dataToUpdate);

            if (error) {
                Alert.alert("Error", error);
                setIsLoading(false);
                return;
            }

            setUser(response);
            Alert.alert("Éxito", "Perfil actualizado correctamente.");
            setIsLoading(false);
        } catch (error) {
            Alert.alert("Error", "No se pudo actualizar el perfil.");
            setIsLoading(false);
        }
    };

    if (!user) return null;

    const returnStatusUsername = () => {
        if (loadingUsername) {
            return (
                <>
                    <ActivityIndicator size={15} color={'#000'} />
                    <TextMalet>Verificando disponibilidad...</TextMalet>
                </>
            )
        }
        if (!loadingUsername && usernameTaken) {
            return (
                <>
                    <IconCross width={20} height={20} fill={'#c54d4dff'} />
                    <TextMalet style={{ fontSize: 12, color: '#c54d4dff' }}>Nombre de usuario no disponible.</TextMalet>
                </>
            )
        }

        if (loadingUsername === false && usernameTaken === false) {
            return (
                <>
                    <IconVerified width={20} height={20} fill={'rgba(54, 189, 137, 1)'} />
                    <TextMalet style={{ fontSize: 12, color: 'rgba(54, 189, 137, 0.93)' }}>Nombre de usuario disponible.</TextMalet>
                </>
            )
        }
    }

    const checkUsername = async () => {
        if (!form.username) return

        if (form.username === user.username) return setUsernameTaken(false)
        const { error, response } = await checkUsernameAvailability(form.username);
        if (error) {
            Alert.alert("Error", error);
            return;
        }
        setUsernameTaken(response)
    }


    useEffect(() => {
        const debounce = setTimeout(() => {
            checkUsername();
        }, 1000);

        return () => {
            clearTimeout(debounce);
        }
    }, [form.username])

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContentNoPadding}>

                    {/* SECCIÓN DEL BANNER */}
                    <TouchableOpacity onPress={handleChangeBanner} activeOpacity={0.9}>
                        {/* Usamos la función helper aquí */}
                        <Image
                            source={getBannerSource()}
                            style={styles.bannerImage}
                            resizeMode="cover"
                        />
                        <View style={styles.bannerEditBadge}>
                            <TextMalet style={styles.badgeText}>Editar Portada</TextMalet>
                        </View>
                    </TouchableOpacity>

                    {/* SECCIÓN DEL AVATAR */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={handleChangeAvatar} style={styles.avatarContainer}>
                            {/* Usamos la función helper aquí */}
                            <Image
                                source={getAvatarSource()}
                                style={styles.avatar}
                            />
                            <View style={styles.avatarEditBadge}>
                                <TextMalet style={styles.badgeText}>Editar</TextMalet>
                            </View>
                        </TouchableOpacity>

                        <TextMalet style={styles.changePhotoText}>Toca para cambiar foto</TextMalet>
                    </View>

                    {/* FORMULARIO */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <TextMalet style={styles.label}>Nombre completo</TextMalet>
                            <Input
                                value={form.name}
                                onChangeText={(text) => handleChange("name", text)}
                                placeholder="Tu nombre"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <TextMalet style={styles.label}>Nombre de usuario</TextMalet>
                            <View style={styles.usernameRow}>
                                <IconAt width={26} height={26} fill="#1d1d1dff" />
                                <Input
                                    value={form.username}
                                    style={{ flex: 1 }}
                                    onChangeText={(text) => handleChange("username", text.trim().toLowerCase())}
                                    placeholder="username"
                                    autoCapitalize="none"
                                />
                            </View>

                            <TouchableOpacity style={{ marginTop: 10, flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                                {returnStatusUsername()}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <TextMalet style={styles.label}>Correo electrónico</TextMalet>
                            <Input
                                value={form.email}
                                placeholder="email@ejemplo.com"
                                editable={false}
                            />
                            <TextMalet style={styles.helperText}>El email no se puede editar aquí.</TextMalet>
                        </View>
                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        onPress={handleSave}
                        disabled={isLoading || usernameTaken}
                        loading={isLoading}
                        text="Guardar Cambios"
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgb(255, 255, 255)",
    },
    scrollContentNoPadding: {
        padding: 0,
        paddingBottom: 40,
    },
    bannerImage: {
        width: '100%',
        height: 150,
        backgroundColor: '#e1e1e1',
    },
    bannerEditBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    avatarSection: {
        alignItems: "center",
        marginTop: -60,
        marginBottom: 20,
    },
    avatarContainer: {
        position: "relative",
        padding: 4,
        backgroundColor: 'white',
        borderRadius: 75,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#007AFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    changePhotoText: {
        marginTop: 8,
        color: '#007AFF',
        fontSize: 12,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        fontWeight: '600',
        color: '#333',
    },
    usernameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: 10
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
});