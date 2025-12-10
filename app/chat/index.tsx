import DashboardHeader from "@/components/DashboardHeader";
import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import ChatItem from "@/components/chat/ChatItem";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";

// Mock Data
const MOCK_CHATS = [
    {
        id: '1',
        name: 'Soporte Malet',
        avatar: require('@/assets/images/placeholders/placeholder_avatar.png'), // Use placeholder for now
        lastMessage: 'Hola, ¿en qué podemos ayudarte?',
        time: '10:30 AM',
        unreadCount: 2,
    },
    {
        id: '2',
        name: 'Juan Pérez',
        avatar: 'https://i.pravatar.cc/150?img=11',
        lastMessage: 'Ya te transferí lo de la cena.',
        time: 'Ayer',
        unreadCount: 0,
    },
    {
        id: '3',
        name: 'María García',
        avatar: 'https://i.pravatar.cc/150?img=5',
        lastMessage: '¡Gracias!',
        time: 'Lun',
        unreadCount: 0,
    },
];

export default function ChatListScreen() {
    const { user } = useAuthStore();

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <DashboardHeader name={user?.name || ''} userAvatar={user?.avatar_url} userBanner={user?.banner_url}
                    username={user?.username || ''} showOptions={false}
                />

                <FlatList
                    data={MOCK_CHATS}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ChatItem
                            id={item.id}
                            name={item.name}
                            avatar={item.avatar}
                            lastMessage={item.lastMessage}
                            time={item.time}
                            unreadCount={item.unreadCount}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingTop: 8,
    },
});
