import { ContainerDash } from "@/components/dashboard/ContainerDash";
import TextMalet from "@/components/TextMalet/TextMalet";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import IconVerified from "@/svgs/common/IconVerified";
import IconWarning from "@/svgs/common/IconWarning";
import IconAI from "@/svgs/dashboard/IconAI";
import IconAt from "@/svgs/dashboard/IconAt";
import IconBudget from "@/svgs/dashboard/IconBudget";
import IconGarzon from "@/svgs/dashboard/IconGarzon";
import IconNotes from "@/svgs/dashboard/IconNotes";
import IconWalletGarzon from "@/svgs/dashboard/IconWalletGarzon";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { memo, useCallback, useState } from "react";
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Button from "./Button/Button";
import ModalOptions from "./shared/ModalOptions";

const PLACEHOLDER_AVATAR = require("@/assets/images/placeholders/placeholder_avatar.png");
const PLACEHOLDER_BANNER = require("@/assets/images/placeholders/placeholder_banner.png");

export const VERIFICATION_TYPES: Record<string, { color: string; name: string; description: string }> = {
    'malet-main-verification': {
        color: '#4d4d4dff',
        name: 'Malet Main Verification',
        description: 'Esta cuenta pertenece a un usuario principal verificado.',
    },
    'malet-business-verification': {
        color: '#ce7018ff',
        name: 'Malet Business Verification',
        description: 'Esta cuenta representa una entidad empresarial verificada en Malet.',
    },
    'malet-ai-verification': {
        color: '#b041e7ff',
        name: 'Malet AI Verification',
        description: 'Esta cuenta es un producto de IA oficial de Malet.',
    },
    'malet-org-verification': {
        color: '#2372ccff',
        name: 'Malet Org Verification',
        description: 'Esta cuenta pertenece a una organización verificada.',
    },
};

const VERIFICATION_DETAILS = [
    {
        id: 'business',
        type: 'malet-business-verification',
        title: '1.- Malet Business Verification',
        sections: [
            {
                title: '1.1.- ¿Qué es la verificación de tipo empresa?',
                content: 'La verificación de tipo empresa es un sello de autenticidad otorgado tras un proceso de validación realizado por el equipo de Malet. Este distintivo certifica la identidad de la marca, producto o servicio, garantizando un entorno de confianza para los usuarios. Asimismo, protege contra el fraude y la desinformación, asegurando que nuestros algoritmos categoricen y recomienden el contenido de manera precisa y acorde a la naturaleza de la empresa.'
            },
            {
                title: '1.2.- ¿Qué beneficios ofrece la verificación de tipo empresa?',
                content: 'Considera la verificación como un "Power-up" de credibilidad. Al obtener la insignia oficial de empresa:\n\n• Generas confianza inmediata en los usuarios, distinguiéndote de cuentas no oficiales.\n\n• Optimizas el algoritmo de Malet para que tus productos lleguen al nicho exacto, evitando tráfico "basura".\n\n• Proteges tu marca contra imitadores, asegurando que el crédito de tus ventas sea solo tuyo.'
            },
            {
                title: '1.3.- ¿Cómo obtener la verificación de tipo empresa?',
                content: 'Desbloquear este estatus es una misión rápida y sencilla. Dirígete a tu Perfil > Configuración y busca la sección de "Verificación". Solo necesitarás cargar la documentación que acredite la existencia legal de tu negocio. Una vez enviado, el equipo de Malet validará los datos y te enviará un correo electrónico con la confirmación de la verificación. En caso de que el proceso de verificación requiera algún documento adicional, te lo notificarán por correo electrónico. Si después de 7 días no hay confirmación, puedes contactart al correo electrónico support@malet.breadriuss.com.'
            }
        ],
        requirementsTitle: '1.4.- Requisitos para obtener la verificación de tipo empresa.',
        requirements: [
            '• La cuenta debe tener una antigüedad mínima de 60 días.',
            '• No poseer ningún bloqueo por contenido inapropiado, reporte abusivo o desinformación.',
            '• Tener una cuenta de Malet activa con email verificado.',
            '• Tener una cuenta de Malet activa con número de teléfono verificado y 2FA activado.',
            '• Tener una foto de perfil y banner de perfil válidos.'
        ],
        exampleTitle: '1.5.- Muestra de la verificación de tipo empresa y consideraciones sobre este estatus.',
        example: {
            name: 'Usuario Ejemplo',
            handle: '@usuario'
        },
        considerations: [
            '• El estatus de verificación de tipo empresa no genera inmunidad sobre las reglas de contenido de Malet. Si la cuenta con dicha verificación infringe las reglas de contenido, se procederá a la suspensión/desactivación de la cuenta .',
            '• Si la marca sufre un cambio de nombre, se debe notificar al equipo de Malet a través del correo electrónico support@malet.breadriuss.com. Esto se hace con el fin de evitar que las cuentas que ya han sido verificadas no sean usadas para suplantar identidades de otras marcas.',
            '• Si una cuenta con este estatus se encuentra con un alto nivel de actividad sospechosa, el equipo de Malet podrá proceder a la suspensión/desactivación de la cuenta. La apelación de reportes debe hacerse antes de 7 días desde la fecha en que se le notifica al usuario.'
        ]
    },
    {
        id: 'ai',
        type: 'malet-ai-verification',
        title: '2.- Malet AI Verification',
        sections: [
            {
                title: '2.1.- ¿Qué es la verificación de tipo IA?',
                content: 'La etiqueta de "Malet AI" identifica a las cuentas automatizadas o bots que operan dentro de la plataforma. Esta distinción es crucial para mantener la transparencia, permitiendo a los usuarios saber cuándo están interactuando con un sistema automatizado en lugar de un ser humano. Es el estándar de calidad para los desarrolladores de la comunidad.'
            },
            {
                title: '2.2.- ¿Qué beneficios ofrece la verificación de IA?',
                content: 'Al verificar tu bot o integración de IA:\n\n• Generas confianza al ser transparente sobre la naturaleza automatizada de la cuenta.\n\n• Accedes a límites de API ampliados para operaciones de alta frecuencia.\n\n• Obtienes acceso anticipado a nuevas herramientas de desarrollo en Malet Developers.'
            },
            {
                title: '2.3.- ¿Cómo obtener la verificación de IA?',
                content: 'El proceso se gestiona desde el portal de desarrolladores. Debes registrar tu aplicación y vincularla a una cuenta de Malet. El equipo de revisión técnica evaluará el comportamiento del bot para asegurar que cumple con las políticas de uso, no genera spam y aporta valor a la comunidad.'
            }
        ],
        requirementsTitle: '2.4.- Requisitos para obtener la verificación de IA.',
        requirements: [
            '• La cuenta debe estar vinculada a un desarrollador verificado (Main o Business).',
            '• El nombre de la cuenta debe indicar claramente su función (ej. "SupportBot").',
            '• La biografía debe contener un enlace a la política de privacidad y términos de servicio.'
        ],
        exampleTitle: '2.5.- Muestra de la verificación de IA.',
        example: {
            name: 'Malet Assistant',
            handle: '@malet_ai'
        },
        considerations: [
            '• El estatus de verificación de tipo AI no genera inmunidad sobre las reglas de contenido de Malet. Si la cuenta con dicha verificación infringe las reglas de contenido, se procederá a la suspensión/desactivación de la cuenta .'
        ]
    },
    {
        id: 'org',
        type: 'malet-org-verification',
        title: '3.- Malet Org Verification',
        sections: [
            {
                title: '3.1.- ¿Qué es la verificación de organización?',
                content: 'Esta insignia dorada/azul está reservada para organizaciones sin fines de lucro, instituciones gubernamentales, educativas y grupos comunitarios reconocidos. Valida que la cuenta representa oficialmente a la entidad en la plataforma.'
            },
            {
                title: '3.2.- Beneficios de la verificación de organización',
                content: '• Credibilidad instantánea para campañas de concientización o comunicados oficiales.\n\n• Herramientas especiales para la gestión de comunidades.\n\n• Protección prioritaria contra la suplantación de identidad.'
            },
        ],
        requirementsTitle: '3.3.- Requisitos para organizaciones.',
        requirements: [
            '• Documentación legal que acredite el estatus de la organización (Acta constitutiva, registro gubernamental, etc.).',
            '• Correo electrónico institucional verificado.',
            '• Cuenta activa con al menos 30 días de antigüedad.'
        ],
        exampleTitle: '3.4.- Muestra de la verificación de organización.',
        example: {
            name: 'Malet Foundation',
            handle: '@malet_org'
        },
        considerations: [
            '• El estatus de verificación de tipo organización no genera inmunidad sobre las reglas de contenido de Malet. Si la cuenta con dicha verificación infringe las reglas de contenido, se procederá a la suspensión/desactivación de la cuenta .',
        ]
    },
    {
        id: 'main',
        type: 'malet-main-verification',
        title: '4.- Malet Main Verification',
        sections: [
            {
                title: '4.1.- ¿Qué es la verificación principal?',
                content: 'Es la insignia de verificación personal para figuras públicas, creadores de contenido, periodistas y usuarios destacados. Confirma que la persona detrás de la cuenta es quien dice ser y tiene una presencia relevante dentro o fuera de Malet.'
            },
            {
                title: '4.2.- Beneficios de la verificación principal',
                content: '• Distinción visual en comentarios y búsquedas.\n\n• Acceso a filtros de notificaciones avanzados.\n\n• Mayor seguridad y soporte prioritario para recuperación de cuentas.'
            },
            {
                title: '4.3.- ¿Cómo solicitarla?',
                content: 'Puedes solicitarla directamente desde la configuración de tu perfil. Se te pedirá una foto de tu documento de identidad (DNI, Pasaporte) y, en algunos casos, enlaces a otros perfiles sociales o artículos de prensa que validen tu notoriedad pública.'
            }
        ],
        requirementsTitle: '4.4.- Requisitos para la verificación principal.',
        requirements: [
            '• Identidad confirmada mediante documento oficial.',
            '• Autenticación de dos factores (2FA) activada.',
            '• Perfil completo (Foto real, nombre real o artístico, biografía).',
            '• Historial de cuenta limpio (sin suspensiones recientes).'
        ],
        exampleTitle: '4.5.- Muestra de la verificación principal.',
        example: {
            name: 'Usuario Verificado',
            handle: '@usuario'
        },
        considerations: [
            '• El estatus de verificación de tipo personal no genera inmunidad sobre las reglas de contenido de Malet. Si la cuenta con dicha verificación infringe las reglas de contenido, se procederá a la suspensión/desactivación de la cuenta .',
            '• No es un certificado legal de identidad real.',
        ]
    }
];

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
                <View style={styles.iconsContainer}>

                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <ContainerDash>
                            <IconAt width={18} height={18} />
                        </ContainerDash>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/ai' as any)}>
                        <ContainerDash style={{ marginLeft: 8 }}>
                            <IconAI width={18} height={18} fill="#313131ff" />
                        </ContainerDash>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/chat/' as any)}>
                        <ContainerDash style={{ marginLeft: 8 }}>
                            <IconNotes width={18} height={18} fill="#313131ff" />
                        </ContainerDash>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/calculator' as any)}>
                        <ContainerDash style={{ marginLeft: 8 }}>
                            <IconBudget width={18} height={18} fill="#313131ff" />
                        </ContainerDash>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/garzon' as any)}>
                        <ContainerDash style={{ marginLeft: 8 }}>
                            <IconGarzon width={18} height={18} fill="#313131ff" />
                        </ContainerDash>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/garzon/wallet' as any)}>
                        <ContainerDash style={{ marginLeft: 8 }}>
                            <IconWalletGarzon width={18} height={18} fill="#313131ff" />
                        </ContainerDash>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { }}>
                        <ContainerDash style={{ marginLeft: 8 }}>
                            <IconWarning width={18} height={18} fill="#313131ff" />
                        </ContainerDash>
                    </TouchableOpacity>
                </View>
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

