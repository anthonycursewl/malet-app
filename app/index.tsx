import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import TextMalet from "@/components/TextMalet/TextMalet";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import IconWallet from "@/svgs/auth/IconWallet";
import IconAt from "@/svgs/dashboard/IconAt";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [credentials, setCredentials] = useState<{ email: string; password: string }>({
    email: '',
    password: '',
  })

  // Auth store
  const { login, loading, setError } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        router.replace('/dashboard/dashboard')
      }
    }
    
    checkAuth();

    return () => {
      setError(null);
    }
  }, [])

  const handleSubmit = async () => {
    const r = await login(credentials);
    if (r) {
      router.replace('/dashboard/dashboard')
    }
  };

  return (
    <SafeAreaView
      style={{
        backgroundColor: '#fff',
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: '100%',
      }}
    >
      <View style={{ marginBottom: 40 }}>
        <IconAt style={{ width: 80, height: 80 }} />
      </View>

      <View style={{ width: '85%', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <View style={{ width: '100%', gap: 10 }}>
          <TextMalet style={{ fontSize: 16 }}>
            Correo Electrónico
          </TextMalet>
          <Input placeholder="tucorreo@ejemplo.com" style={{ width: '100%' }} 
          value={credentials.email} 
          onChangeText={(text) => setCredentials(prev => ({ ...prev, email: text }))} 
          />
        </View>

        <View style={{ width: '100%', gap: 10 }}>
          <TextMalet style={{ fontSize: 16 }}>
            Contraseña
          </TextMalet>
          <Input placeholder="********" style={{ width: '100%' }} 
          value={credentials.password} 
          onChangeText={(text) => setCredentials(prev => ({ ...prev, password: text }))} 
          />
        </View>

        <View style={{ width: '100%', marginTop: 20, justifyContent: 'center', alignItems: 'center' }}>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Button text="Iniciar Sesión" onPress={handleSubmit} style={{ width: '100%' }} />
          )}
        </View>

        <TouchableOpacity onPress={() => {router.push('/auth/register')}} style={{ 
          marginTop: 20, 
          flexDirection: 'row', 
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%', 
          gap: 10 
          }}>
          <IconWallet style={{ width: 24, height: 24 }} />
          <TextMalet style={{ fontSize: 16 }}>
            Crea tu cuenta de Malet aquí!
          </TextMalet>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}
