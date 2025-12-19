import TextMalet from "@/components/TextMalet/TextMalet";
import React from "react";
import { StyleSheet, View } from "react-native";

interface MessageBubbleProps {
    text: string;
    isMe: boolean;
    time: string;
}

export default function MessageBubble({ text, isMe, time }: MessageBubbleProps) {
    return (
        <View style={[styles.container, isMe ? styles.meContainer : styles.otherContainer]}>
            <View style={[styles.bubble, isMe ? styles.meBubble : styles.otherBubble]}>
                <TextMalet style={[styles.text, isMe ? styles.meText : styles.otherText]}>{text}</TextMalet>
                <TextMalet style={[styles.time, isMe ? styles.meTime : styles.otherTime]}>{time}</TextMalet>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        flexDirection: 'row',
    },
    meContainer: {
        justifyContent: 'flex-end',
    },
    otherContainer: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    meBubble: {
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: '#f0f0f0',
        borderBottomLeftRadius: 4,
    },
    text: {
        fontSize: 16,
    },
    meText: {
        color: 'white',
    },
    otherText: {
        color: 'black',
    },
    time: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    meTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    otherTime: {
        color: '#888',
    },
});
