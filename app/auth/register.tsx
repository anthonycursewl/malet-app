import Button from "@/components/Button/Button";
import { InputField } from "@/components/AddWallet/InputField";
import TextMalet from "@/components/TextMalet/TextMalet";
import { UserPrimitives } from "@/shared/entities/User";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import IconAt from "@/svgs/dashboard/IconAt";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RegisterPayload = Pick<UserPrimitives, 'name' | 'username' | 'email' | 'password'>;

export default function Register() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<RegisterPayload>({
    name: '',
    username: '',
    email: '',
    password: '',
  });

  const { register, loading, error } = useAuthStore();

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Malet | Error', error);
    }
  }, [error]);

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleInputChange = (field: keyof RegisterPayload, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    const dataTrimmed = {
      name: userData.name.trim(),
      username: userData.username.trim(),
      email: userData.email.trim(),
      password: userData.password.trim(),
    }

    const r = await register(dataTrimmed);
    if (r) {
      Alert.alert('Malet | Éxito', `¡Te has registrado correctamente ${dataTrimmed.name}, Inicia sesión!`);
      setUserData({
        name: '',
        username: '',
        email: '',
        password: '',
      });
      setStep(1);
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <IconAt style={styles.logo} />
            <TextMalet style={styles.title}>Crear cuenta</TextMalet>
          </View>

          <View style={styles.steps}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[styles.dot, step === s && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.form}>
            {step === 1 && (
              <View style={{ gap: 16 }}>
                <InputField
                  label="Nombres"
                  placeholder="Tu nombre completo..."
                  value={userData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                />
                <InputField
                  label="Nombre de Usuario"
                  placeholder="Elige un @username..."
                  value={userData.username}
                  onChangeText={(text) => handleInputChange('username', text.toLowerCase().trim())}
                />
              </View>
            )}

            {step === 2 && (
              <InputField
                label="Correo Electrónico"
                placeholder="tucorreo@ejemplo.com"
                value={userData.email}
                onChangeText={(text) => handleInputChange('email', text)}
              />
            )}

            {step === 3 && (
              <InputField
                label="Contraseña"
                placeholder="Crea una contraseña segura"
                value={userData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry
              />
            )}
          </View>

          <View style={styles.buttons}>
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Button
                text={step === 3 ? 'Registrarse' : 'Siguiente'}
                onPress={step === 3 ? handleSubmit : handleNext}
              />
            )}

            {step > 1 && !loading && (
              <Button
                text="Volver atrás"
                onPress={handlePrevious}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  dotActive: {
    backgroundColor: '#1a1a1a',
    width: 24,
  },
  form: {
    gap: 16,
    marginBottom: 32,
  },
  buttons: {
    gap: 12,
  },
});
