import TextMalet from "@/components/TextMalet/TextMalet";
import IconAt from "@/svgs/dashboard/IconAt";
import React, { memo } from "react";
import { DimensionValue, View } from "react-native";
import { styles } from "./styles";

interface RateLimitBannerProps {
    countdown: number;
}

export const RateLimitBanner = memo(({ countdown }: RateLimitBannerProps) => {
    const formattedTime = countdown > 60
        ? `${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`
        : `${countdown}s`;

    const progressWidth = `${Math.min(100, (countdown / 60) * 100)}%` as DimensionValue;

    return (
        <View style={styles.rateLimitContainer}>
            <View style={styles.rateLimitContent}>
                <View style={styles.rateLimitIconContainer}>
                    <IconAt width={18} height={18} fill={"rgba(207, 134, 38, 0.9)"} />
                </View>
                <View style={styles.rateLimitTextContainer}>
                    <TextMalet style={styles.rateLimitTitle}>Límite alcanzado</TextMalet>
                    <TextMalet style={styles.rateLimitMessage}>
                        Podrás enviar mensajes en{' '}
                        <TextMalet style={styles.rateLimitCountdown}>
                            {formattedTime}
                        </TextMalet>
                    </TextMalet>
                </View>
            </View>
            <View style={styles.rateLimitProgressBar}>
                <View
                    style={[
                        styles.rateLimitProgressFill,
                        { width: progressWidth }
                    ]}
                />
            </View>
        </View>
    );
});

RateLimitBanner.displayName = 'RateLimitBanner';
