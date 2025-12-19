import TextMalet from "@/components/TextMalet/TextMalet";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

interface ChatItemProps {
    id: string;
    name: string;
    avatar: any; // string (url) or require result
    lastMessage: string;
    time: string;
    unreadCount?: number;
}

export default function ChatItem({ id, name, avatar, lastMessage, time, unreadCount }: ChatItemProps) {
    return (
        <TouchableOpacity style={styles.container} onPress={() => router.push({ pathname: "/chat/[id]", params: { id } })}>
            <Image source={typeof avatar === 'string' ? { uri: avatar } : avatar} style={styles.avatar} />
            <View style={styles.content}>
                <View style={styles.header}>
                    <TextMalet style={styles.name}>{name}</TextMalet>
                    <TextMalet style={styles.time}>{time}</TextMalet>
                </View>
                <View style={styles.footer}>
                    <TextMalet style={styles.message} numberOfLines={1}>{lastMessage}</TextMalet>
                    {unreadCount && unreadCount > 0 ? (
                        <View style={styles.badge}>
                            <TextMalet style={styles.badgeText}>{unreadCount}</TextMalet>
                        </View>
                    ) : null}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 1,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#eee',
    },
    content: {
        flex: 1,
        marginLeft: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    time: {
        fontSize: 12,
        color: '#888',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    message: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        marginRight: 8,
    },
    badge: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
