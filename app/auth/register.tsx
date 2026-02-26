import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import TextMalet from "@/components/TextMalet/TextMalet";
import { UserPrimitives } from "@/shared/entities/User";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import IconAt from "@/svgs/dashboard/IconAt";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
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

  // Auth store 
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

  const renderStepIndicator = () => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      gap: 10,
      width: '100%',
    }}>
      {[1, 2, 3].map((stepNumber) => (
        <View
          key={stepNumber}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: step === stepNumber ? '#007AFF' : '#E5E5EA',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TextMalet
            style={{ color: step === stepNumber ? 'white' : 'gray' }}
          >
            {stepNumber.toString()}
          </TextMalet>
        </View>
      ))}
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={{ gap: 20, justifyContent: 'center', alignItems: 'center' }}>

            <View style={{ width: '100%', gap: 10 }}>
              <TextMalet style={{ fontSize: 16 }}>
                Nombres
              </TextMalet>
              <Input
                placeholder="Tu nombre completo..."
                value={userData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                style={{ width: '100%' }}
                autoCapitalize="words"
              />
            </View>

            <View style={{ width: '100%', gap: 10 }}>
              <TextMalet style={{ fontSize: 16 }}>
                Nombre de Usuario
              </TextMalet>
              <Input
                placeholder="Elige un @username..."
                value={userData.username}
                onChangeText={(text) => handleInputChange('username', text.toLowerCase().trim())}
                style={{ width: '100%' }}
                autoCapitalize="none"
                keyboardType="default"
              />
            </View>

          </View>

        );
      case 2:
        return (
          <View style={{ gap: 20, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '100%', gap: 10 }}>
              <TextMalet style={{ fontSize: 16 }}>
                Correo Electrónico
              </TextMalet>
              <Input
                placeholder="tucorreo@ejemplo.com"
                value={userData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ width: '100%' }}
              />
            </View>
          </View>
        );
      case 3:
        return (
          <View style={{ gap: 20, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '100%', gap: 10 }}>
              <TextMalet style={{ fontSize: 16 }}>
                Contraseña
              </TextMalet>
              <Input
                placeholder="Crea una contraseña segura"
                value={userData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry
                style={{ width: '100%' }}
              />
            </View>

          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: '#fff',
    }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{
            width: '95%',
            alignSelf: 'center',
            backgroundColor: '#fff',
            borderRadius: 10,
          }}>
            <View style={{ alignItems: 'center', marginBottom: 30 }}>
              <IconAt style={{ width: 80, height: 80 }} />
            </View>

            <View style={{ gap: 24 }}>
              {renderStepIndicator()}
              {renderStep()}

              <View style={{ marginTop: 10, gap: 12 }}>
                {loading ? (
                  <View style={{ alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color="#007AFF" />
                  </View>
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
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
