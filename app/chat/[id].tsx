import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import TextMalet from "@/components/TextMalet/TextMalet";
import MessageBubble from "@/components/chat/MessageBubble";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

// Mock Messages
const MOCK_MESSAGES = [
    { id: '1', text: 'Hola, ¿cómo estás?', isMe: false, time: '10:30 AM' },
    { id: '2', text: '¡Hola! Todo bien, ¿y tú?', isMe: true, time: '10:31 AM' },
    { id: '3', text: 'Bien también, gracias por preguntar.', isMe: false, time: '10:32 AM' },
    { id: '4', text: 'Me alegro.', isMe: true, time: '10:33 AM' },
];

export default function ChatRoomScreen() {
    const { id } = useLocalSearchParams();
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState('');

    const handleSend = () => {
        if (inputText.trim()) {
            const newMessage = {
                id: Date.now().toString(),
                text: inputText,
                isMe: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages([...messages, newMessage]);
            setInputText('');
        }
    };

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                {/* Simple Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <TextMalet style={styles.backText}>‹</TextMalet>
                    </TouchableOpacity>
                    <TextMalet style={styles.headerTitle}>Chat {id}</TextMalet>
                </View>

                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <MessageBubble text={item.text} isMe={item.isMe} time={item.time} />
                    )}
                    contentContainerStyle={styles.messagesList}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
                >
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Escribe un mensaje..."
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                            <TextMalet style={styles.sendButtonText}>Enviar</TextMalet>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        marginRight: 16,
    },
    backText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    messagesList: {
        padding: 16,
        paddingBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
        fontSize: 16,
    },
    sendButton: {
        padding: 10,
    },
    sendButtonText: {
        color: '#007AFF',
        fontWeight: '600',
        fontSize: 16,
    },
});
