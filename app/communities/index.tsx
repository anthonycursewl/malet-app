import CommunitiesHeader from '@/components/communities/CommunitiesHeader';
import CommunitiesTabBar from '@/components/communities/CommunitiesTabBar';
import CommunityCard from '@/components/communities/CommunityCard';
import RecommendationChips from '@/components/communities/RecommendationChips';
import TextMalet from '@/components/TextMalet/TextMalet';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data
const COMMUNITIES = [
    {
        id: '1',
        title: 'Crypto Traders Venezuela',
        description: 'Comunidad dedicada al trading de criptomonedas en Venezuela.',
        imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y3J5cHRvfGVufDB8fDB8fHww',
        membersCount: 1250,
        height: 220,
    },
    {
        id: '2',
        title: 'Emprendedores Digitales',
        description: 'Espacio para compartir ideas y estrategias de negocios digitales.',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8dGVhbXxlbnwwfHwwfHx8MA%3D%3D',
        membersCount: 890,
        height: 280,
    },
    {
        id: '3',
        title: 'Designers Hub',
        description: 'Inspiración y recursos para diseñadores UI/UX.',
        imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZGVzaWdufGVufDB8fDB8fHww',
        membersCount: 3400,
        height: 200,
    },
    {
        id: '4',
        title: 'Desarrolladores React Native',
        description: 'Todo sobre React Native y Expo.',
        imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmVhY3R8ZW58MHx8MHx8fDA%3D',
        membersCount: 5600,
        height: 260,
    },
    {
        id: '5',
        title: 'Finanzas Personales',
        description: 'Aprende a gestionar tu dinero de forma inteligente.',
        imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bW9uZXl8ZW58MHx8MHx8fDA%3D',
        membersCount: 2100,
        height: 240,
    },
    {
        id: '6',
        title: 'Viajeros por el Mundo',
        description: 'Comparte tus experiencias de viaje y descubre nuevos destinos.',
        imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8dHJhdmVsfGVufDB8fDB8fHww',
        membersCount: 4500,
        height: 300,
    },
    {
        id: '7',
        title: 'Fotografía Creativa',
        description: 'Consejos, trucos y galería de fotos increíbles.',
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FtZXJafGVufDB8fDB8fHww',
        membersCount: 1800,
        height: 220,
    },
];

export default function CommunitiesScreen() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'options'>('home');

    // Split data into two columns for masonry effect
    const column1Data = COMMUNITIES.filter((_, index) => index % 2 === 0);
    const column2Data = COMMUNITIES.filter((_, index) => index % 2 !== 0);

    return (
        <SafeAreaView style={styles.container}>
            <CommunitiesHeader />

            <View style={styles.contentContainer}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.titleContainer}>
                        <TextMalet style={styles.pageTitle}>Descubre</TextMalet>
                        <TextMalet style={styles.pageSubtitle}>Encuentra tu tribu digital.</TextMalet>
                    </View>

                    <RecommendationChips />

                    <View style={styles.masonryContainer}>
                        <View style={styles.column}>
                            {column1Data.map((item) => (
                                <CommunityCard
                                    key={item.id}
                                    title={item.title}
                                    description={item.description}
                                    imageUrl={item.imageUrl}
                                    membersCount={item.membersCount}
                                    height={item.height}
                                    onPress={() => console.log(`Pressed ${item.title}`)}
                                />
                            ))}
                        </View>

                        <View style={styles.column}>
                            {column2Data.map((item) => (
                                <CommunityCard
                                    key={item.id}
                                    title={item.title}
                                    description={item.description}
                                    imageUrl={item.imageUrl}
                                    membersCount={item.membersCount}
                                    height={item.height}
                                    onPress={() => console.log(`Pressed ${item.title}`)}
                                />
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Sticky Bottom Tab Bar */}
                <View style={styles.stickyFooter}>
                    <CommunitiesTabBar
                        activeTab={activeTab}
                        onTabPress={setActiveTab}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        flex: 1,
        position: 'relative',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 90,
    },
    titleContainer: {
        marginBottom: 12,
        marginTop: 2,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    pageSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    masonryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 10,
    },
    column: {
        flex: 1,
        gap: 0,
    },
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
    },
});
