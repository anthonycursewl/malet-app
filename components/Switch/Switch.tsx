import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    LayoutChangeEvent,
    Pressable,
    StyleProp,
    View,
    ViewStyle,
} from 'react-native';
import TextMalet from '../TextMalet/TextMalet';

export interface SwitchOption<T = string> {
    value: T;
    label: string;
    icon?: React.ReactNode;
}

interface SwitchProps<T = string> {
    options: SwitchOption<T>[];
    selected: T;
    onSelect: (value: T) => void;
    style?: StyleProp<ViewStyle>;
    activeColor?: string;
    activeTextColor?: string;
    inactiveColor?: string;
    inactiveTextColor?: string;
    height?: number;
    borderRadius?: number;
    fontSize?: number;
    fontWeight?: '400' | '500' | '600' | '700';
    gap?: number;
    animated?: boolean;
}

export default function Switch<T = string>({
    options,
    selected,
    onSelect,
    style,
    activeColor = '#000',
    activeTextColor = '#fff',
    inactiveColor = 'transparent',
    inactiveTextColor = '#666',
    height = 38,
    borderRadius = 22,
    fontSize = 13,
    fontWeight = '500',
    gap = 3,
    animated = true,
}: SwitchProps<T>) {
    const containerRef = useRef<View>(null);
    const [segmentWidth, setSegmentWidth] = useState(0);
    const translateX = useRef(new Animated.Value(0)).current;

    const selectedIndex = options.findIndex((o) => o.value === selected);

    const handleLayout = useCallback((e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        setSegmentWidth((w - gap * (options.length - 1)) / options.length);
    }, [options.length, gap]);

    useEffect(() => {
        const target = selectedIndex * (segmentWidth + gap);
        if (animated && segmentWidth > 0) {
            translateX.stopAnimation();
            Animated.spring(translateX, {
                toValue: target,
                useNativeDriver: true,
                tension: 100,
                friction: 12,
            }).start();
        } else {
            translateX.setValue(target);
        }
    }, [selectedIndex, segmentWidth, gap, animated, translateX]);

    return (
        <View
            ref={containerRef}
            onLayout={handleLayout}
            style={[
                {
                    flexDirection: 'row',
                    backgroundColor: '#F0F0F0',
                    borderRadius,
                    padding: gap,
                    position: 'relative',
                },
                style,
            ]}
        >
            {segmentWidth > 0 && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: gap,
                        left: gap,
                        width: segmentWidth,
                        height: height - gap * 2,
                        backgroundColor: activeColor,
                        borderRadius,
                        transform: [{ translateX }],
                    }}
                />
            )}

            {options.map((option, index) => {
                const isActive = option.value === selected;

                return (
                    <Pressable
                        key={String(option.value)}
                        onPress={() => onSelect(option.value)}
                        style={{
                            flex: 1,
                            height: height - gap * 2,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            borderRadius,
                            zIndex: 1,
                        }}
                    >
                        {option.icon && (
                            <View style={{ opacity: isActive ? 1 : 0.5 }}>
                                {option.icon}
                            </View>
                        )}
                        <TextMalet
                            style={{
                                fontSize,
                                fontWeight: isActive ? '600' : fontWeight,
                                color: isActive ? activeTextColor : inactiveTextColor,
                            }}
                        >
                            {option.label}
                        </TextMalet>
                    </Pressable>
                );
            })}
        </View>
    );
}
