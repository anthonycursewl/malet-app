import React, { useRef, useEffect } from 'react'
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

type Props = {
  value: 'saving' | 'expense'
  onChange: (v: 'saving' | 'expense') => void
}

export default function MoonSunToggle({ value, onChange }: Props) {
  const anim = useRef(new Animated.Value(value === 'saving' ? 0 : 1)).current

  useEffect(() => {
    Animated.spring(anim, { toValue: value === 'saving' ? 0 : 1, useNativeDriver: true, friction: 12 }).start()
  }, [value])

  const translate = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 36] })

  return (
    <View style={styles.container} accessible accessibilityRole="tablist">
      <View style={styles.track}>
        <Animated.View style={[styles.indicator, { transform: [{ translateX: translate }] }]} />
        <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected: value === 'saving' }} onPress={() => onChange('saving')} style={styles.half}>
          <MaterialIcons name="brightness-3" size={20} color={value === 'saving' ? '#0b69ff' : '#475569'} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected: value === 'expense' }} onPress={() => onChange('expense')} style={styles.half}>
          <MaterialIcons name="wb-sunny" size={20} color={value === 'expense' ? '#ff5b5b' : '#475569'} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 96,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    position: 'relative',
  },
  half: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  indicator: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 36,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
})
