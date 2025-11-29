import Input from "@/components/Input/Input";
import TextMalet from "@/components/TextMalet/TextMalet";
import IconAt from "@/svgs/dashboard/IconAt";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUGGESTIONS = [
    "Crear un plan de ahorro",
    "Analizar mis gastos",
    "¿Cómo puedo invertir?",
    "Reducir deudas",
];

export default function AIAgentScreen() {
    const [inputText, setInputText] = useState('');

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <TextMalet style={styles.backText}>‹</TextMalet>
                    </TouchableOpacity>
                    <TextMalet style={styles.headerTitle}>Malet AI</TextMalet>
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                >
                    {/* AI Visual Representation */}
                    <View style={styles.aiContainer}>
                        <View style={styles.aiCircle}>
                            <IconAt height={60} width={60} fill="#1a1a1aff" />
                        </View>

                        <TextMalet style={styles.greeting}>Hola, soy Malet AI.</TextMalet>
                        <TextMalet style={styles.subGreeting}>¿En qué puedo ayudarte hoy?</TextMalet>
                    </View>

                    {/* Suggestions */}
                    <View style={styles.suggestionsContainer}>
                        {SUGGESTIONS.map((suggestion, index) => (
                            <TouchableOpacity key={index} style={styles.suggestionChip}>
                                <TextMalet style={styles.suggestionText}>{suggestion}</TextMalet>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Mock Conversation / Context */}
                    <View style={styles.contextCard}>
                        <TextMalet style={styles.contextTitle}>Tip del día</TextMalet>
                        <TextMalet style={styles.contextText}>
                            Basado en tus gastos recientes, podrías ahorrar un 15% si reduces las comidas fuera de casa esta semana.
                        </TextMalet>
                    </View>
                </ScrollView>

                {/* Input Area */}
                <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                        <Input
                            style={{ width: '84%' }}
                            placeholder="Escribe tu consulta..."
                            value={inputText}
                            onChangeText={setInputText}
                        />

                        <TouchableOpacity style={styles.sendButton}>
                            <LinearGradient
                                colors={['#4F46E5', '#7C3AED']}
                                style={styles.sendGradient}
                            >
                                <TextMalet style={styles.sendButtonText}>M</TextMalet>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    backText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    aiContainer: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    aiCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
    },
    subGreeting: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: '80%',
    },
    suggestionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 32,
    },
    suggestionChip: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    suggestionText: {
        color: '#4B5563',
        fontSize: 13,
        fontWeight: '500',
    },
    contextCard: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#414141ff',
        borderStyle: 'dashed',
        overflow: 'hidden',
        paddingHorizontal: 15,
        paddingVertical: 15,
    },
    contextTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    contextText: {
        fontSize: 14,
        lineHeight: 22,
    },
    inputWrapper: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: 'white',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        gap: 10
    },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginRight: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    sendGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: -2,
    },
});
