import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

type Props = {
  value: string
  onChange: (v: string) => void
}

const KEYS = ['1','2','3','4','5','6','7','8','9','.','0','DEL']

function formatDisplay(v: string): string {
  if (!v || v.length === 0) return '0'
  const dotIndex = v.indexOf('.')
  if (dotIndex >= 0) {
    const intP = v.substring(0, dotIndex) || '0'
    const decP = v.substring(dotIndex+1, dotIndex+3) // max 2 decimals
    return intP + (decP ? '.' + decP : '')
  }
  return v
}

export default function CustomAmountPad({ value, onChange }: Props) {
  const handleKey = (k: string) => {
    if (k === 'DEL') {
      onChange((value ?? '').slice(0, -1))
      return
    }
    if (k === '.') {
      if ((value ?? '').includes('.')) return
      onChange((value ?? '0') + '.')
      return
    }
    if ((value ?? '').includes('.')) {
      const [intP, decP] = (value ?? '').split('.')
      if ((decP?.length ?? 0) < 2) onChange(((intP ?? '0')) + '.' + (decP ?? '') + k)
    } else {
      if ((value ?? '').length < 9) onChange((value ?? '') + k)
    }
  }

  const display = formatDisplay(value)

  return (
    <View style={styles.padContainer}>
      <View style={styles.display}>
        <Text style={styles.displayText}>${display}</Text>
      </View>
      <View style={styles.grid}>
        {KEYS.map((k) => (
          <TouchableOpacity key={k} onPress={() => handleKey(k)} style={styles.key}>
            <Text style={styles.keyText}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  padContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  display: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  displayText: {
    fontSize: 28,
    fontWeight: '700',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  key: {
    width: 78,
    height: 56,
    margin: 8,
    borderRadius: 12,
    backgroundColor: '#f2f4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
  },
})
