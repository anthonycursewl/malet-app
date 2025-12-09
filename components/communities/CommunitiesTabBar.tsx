import TextMalet from '@/components/TextMalet/TextMalet';
import IconSettings from '@/svgs/common/IconSettings';
import IconCommunities from '@/svgs/dashboard/IconCommunities';
import IconNotes from '@/svgs/dashboard/IconNotes';
import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface CommunitiesTabBarProps {
    activeTab?: 'home' | 'messages' | 'options';
    onTabPress?: (tab: 'home' | 'messages' | 'options') => void;
}

const CommunitiesTabBar = memo(({ activeTab = 'home', onTabPress }: CommunitiesTabBarProps) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.tab}
                onPress={() => onTabPress?.('home')}
                activeOpacity={0.7}
            >
                <IconCommunities
                    width={24}
                    height={24}
                    fill={activeTab === 'home' ? '#1a1a1a' : '#9ca3af'}
                />
                <TextMalet style={[styles.label, activeTab === 'home' && styles.activeLabel]}>
                    Inicio
                </TextMalet>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tab}
                onPress={() => onTabPress?.('messages')}
                activeOpacity={0.7}
            >
                <IconNotes
                    width={24}
                    height={24}
                    fill={activeTab === 'messages' ? '#1a1a1a' : '#9ca3af'}
                />
                <TextMalet style={[styles.label, activeTab === 'messages' && styles.activeLabel]}>
                    Mensajes
                </TextMalet>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tab}
                onPress={() => onTabPress?.('options')}
                activeOpacity={0.7}
            >
                <IconSettings
                    width={24}
                    height={24}
                    fill={activeTab === 'options' ? '#1a1a1a' : '#9ca3af'}
                />
                <TextMalet style={[styles.label, activeTab === 'options' && styles.activeLabel]}>
                    Opciones
                </TextMalet>
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingVertical: 12,
        paddingBottom: 12,
        justifyContent: 'space-around',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        flex: 1,
        paddingVertical: 4,
    },
    label: {
        fontSize: 11,
        color: '#9ca3af',
        fontWeight: '500',
    },
    activeLabel: {
        color: '#1a1a1a',
        fontWeight: '600',
    },
});

export default CommunitiesTabBar;
