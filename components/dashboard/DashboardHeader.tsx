import TextMalet from "@/components/TextMalet/TextMalet";
import { VERIFICATION_DETAILS, VERIFICATION_TYPES } from "@/shared/constants/VERIFICATION_DETAILS";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import IconVerified from "@/svgs/common/IconVerified";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { memo, useCallback, useState } from "react";
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Button from "../Button/Button";
import ModalOptions from "../shared/ModalOptions";
import { DashboardOptions } from "./DashboardOptions/DashboardOptions";

const PLACEHOLDER_AVATAR = require("@/assets/images/placeholders/placeholder_avatar.png");
const PLACEHOLDER_BANNER = require("@/assets/images/placeholders/placeholder_banner.png");

const VerificationItem = memo(({ item }: { item: typeof VERIFICATION_DETAILS[0] }) => {
    const verificationType = VERIFICATION_TYPES[item.type];

    return (
        <View style={{ marginBottom: 30 }}>
            <TextMalet style={{ marginBottom: 10, color: '#313131', fontSize: 18, fontWeight: 'bold' }}>
                {item.title}
            </TextMalet>

            {item.sections.map((section, index) => (
                <View key={index}>
                    <TextMalet style={{ marginBottom: 5, color: '#818181ff', fontSize: 15 }}>
                        {section.title}
                    </TextMalet>
                    <TextMalet style={{ marginBottom: 10, marginLeft: 12 }}>
                        {section.content}
                    </TextMalet>
                </View>
            ))}

            <View style={{ marginBottom: 18 }}>
                <TextMalet style={{ marginBottom: 10, color: '#818181ff', fontSize: 15 }}>
                    {item.requirementsTitle}
                </TextMalet>

                <View style={{ marginLeft: 12, gap: 12 }}>
                    {item.requirements.map((req, index) => (
                        <TextMalet key={index}>{req}</TextMalet>
                    ))}
                </View>
            </View>

            <View>
                <TextMalet style={{ marginBottom: 10, color: '#818181ff', fontSize: 15 }}>
                    {item.exampleTitle}
                </TextMalet>

                <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}>
                    <View style={{
                        flexDirection: 'row', alignItems: 'flex-start', gap: 5,
                        borderColor: '#d6d6d6ff',
                        borderWidth: 1,
                        borderRadius: 18,
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        width: '100%',
                    }}>
                        <Image source={PLACEHOLDER_AVATAR} style={{ width: 50, height: 50, borderRadius: 100 }} />

                        <View style={{ marginTop: 7, flexDirection: 'row', gap: 3 }}>
                            <View>
                                <TextMalet>{item.example.name}</TextMalet>
                                <TextMalet>{item.example.handle}</TextMalet>
                            </View>
                            <IconVerified width={20} height={20} fill={verificationType.color} />
                        </View>

                    </View>
                </View>

                {item.considerations.length > 0 && (
                    <View style={{ marginLeft: 12, gap: 12 }}>
                        {item.considerations.map((cons, index) => (
                            <TextMalet key={index}>{cons}</TextMalet>
                        ))}
                    </View>
                )}

            </View>
        </View>
    );
});

interface DashboardHeaderProps {
    name: string;
    userAvatar?: string | null;
    userBanner?: string | null;
    username: string;
    showOptions?: boolean;
}

const DashboardHeader = memo(({ name, userAvatar, userBanner, username, showOptions = true }: DashboardHeaderProps) => {
    const { width } = Dimensions.get('window');
    const { user } = useAuthStore();
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationModal, setVerificationModal] = useState(false);

    const verification = user?.verified && user.verification_type ? VERIFICATION_TYPES[user.verification_type.type] : null;

    const getTruncatedName = useCallback((name: string) => {
        const maxLength = Math.floor(width / 15);
        const maxDisplayLength = Math.max(15, maxLength);

        if (name.length > maxDisplayLength) {
            return `${name.slice(0, maxDisplayLength - 3)}...`;
        }
        return name;
    }, [width]);

    const handleOpenVerificationModal = useCallback(() => {
        setVerificationModal(true);
    }, [verificationModal]);

    return (
        <View style={{ gap: 8 }}>
            {userBanner && (
                <View style={[StyleSheet.absoluteFill, { height: 160, top: -40, marginHorizontal: -20, zIndex: -1 }]}>
                    <Image
                        source={{ uri: userBanner }}
                        style={{ width: '100%', height: '100%', opacity: 0.4 }}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                </View>
            )}

            <View style={{ paddingBottom: 7, paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <TextMalet style={styles.headerText} numberOfLines={1}>
                            Bienvenido,{" "}
                        </TextMalet>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
                            <TextMalet style={{ color: 'rgba(109, 109, 109, 1)' }} numberOfLines={1} ellipsizeMode="tail">
                                {getTruncatedName(name)}
                            </TextMalet>
                            {verification && (
                                <TouchableOpacity onPress={() => setShowVerificationModal(true)}>
                                    <IconVerified width={20} height={20} fill={verification.color} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={{ marginTop: 2 }}>
                        <TextMalet style={{ color: 'rgba(116, 116, 116, 1)', fontSize: 13 }}>@{getTruncatedName(username)}</TextMalet>
                    </View>
                </View>

                <TouchableOpacity onPress={() => router.push('/profile')}>
                    <Image
                        source={userAvatar ? { uri: userAvatar } : PLACEHOLDER_AVATAR}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0' }}
                    />
                </TouchableOpacity>
            </View>

            {showOptions && (
                <DashboardOptions styles={styles} />
            )}

            {verification && (
                <ModalOptions visible={showVerificationModal} onClose={() => setShowVerificationModal(false)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {userBanner && (
                            <View style={[StyleSheet.absoluteFill, { height: 160, top: -34, marginHorizontal: -20, zIndex: -1, overflow: 'hidden' }]}>
                                <Image
                                    source={{ uri: userBanner }}
                                    style={{ width: '100%', height: '100%', opacity: 0.4, borderRadius: 20 }}
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                />
                            </View>
                        )}

                        <Image
                            source={userAvatar ? { uri: userAvatar } : PLACEHOLDER_AVATAR}
                            style={{ width: 45, height: 45, borderRadius: 100 }}
                        />

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 5 }}>
                            <View>
                                <TextMalet>{name}</TextMalet>
                                <TextMalet style={{ color: 'rgba(116, 116, 116, 1)', fontSize: 13 }}>@{username}</TextMalet>
                            </View>
                            <IconVerified width={20} height={20} fill={verification.color} />
                        </View>
                    </View>

                    <ScrollView>
                        <View style={{ marginTop: 40, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ alignItems: 'center', gap: 4 }}>
                                <IconVerified width={50} height={50} fill={verification.color} />
                                <TextMalet style={{ fontSize: 15 }}>{verification.name}</TextMalet>
                            </View>

                            <View style={{ width: '90%', alignItems: 'center', justifyContent: 'center' }}>
                                <TextMalet style={{ color: 'rgba(116, 116, 116, 1)', fontSize: 13, textAlign: 'center' }}>{verification.description}</TextMalet>
                            </View>
                        </View>

                    </ScrollView>

                    <Button text="Obtener verificación" onPress={handleOpenVerificationModal} />
                </ModalOptions>
            )}

            {(
                <ModalOptions visible={verificationModal} onClose={() => setVerificationModal(false)} isOnTop>
                    <FlatList
                        data={VERIFICATION_DETAILS}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <VerificationItem item={item} />}
                        showsVerticalScrollIndicator={false}
                        style={{ flex: 1 }}
                        initialNumToRender={1}
                        maxToRenderPerBatch={1}
                        windowSize={3}
                        ListHeaderComponent={
                            <View style={{ gap: 10, marginBottom: 20 }}>
                                <View>
                                    <TextMalet style={{ marginBottom: 10, color: '#313131' }}>
                                        Si eres una empresa registrada en Malet, puedes obtener una insignia de verificación para dar confianza a tus clientes y
                                        ser priorizado en los resultados de búsqueda, recomendaciones a usuarios y en las listas de empresas.
                                    </TextMalet>

                                    <TextMalet style={{
                                        marginBottom: 10, color: '#818181ff',
                                        borderLeftColor: '#fa5f5fff',
                                        borderLeftWidth: 2,
                                        paddingLeft: 10, fontSize: 13
                                    }}>Para obtener la verificación necesitas cumplir los requisitos para cada tipo de verificación.</TextMalet>
                                </View>
                            </View>
                        }
                    />
                </ModalOptions>
            )}
        </View >
    );
});

const styles = StyleSheet.create({
    headerText: {
        fontSize: 15,
    },
    iconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
    },
});

export default DashboardHeader;

