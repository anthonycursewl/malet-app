import TextMalet from "@/components/TextMalet/TextMalet";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import IconAt from "@/svgs/dashboard/IconAt";
import { router } from "expo-router";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ModalAccounts = forwardRef((props, ref) => {
    const { 
        loading, 
        error, 
        getAllAccountsByUserId, 
        accounts, 
        setSelectedAccount 
    } = useAccountStore();
    const { user } = useAuthStore()

    const [modalVisible, setModalVisible] = useState(false);
    const [contentVisible, setContentVisible] = useState(false);
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (modalVisible && accounts.length === 0) {
            getAllAccountsByUserId(user.id);
        }
    }, [modalVisible, user.id]);

    useEffect(() => {
        if (error) {
            Alert.alert('Error al cargar cuentas', error);
        }
    }, [error]);

    const openModal = () => {
        setModalVisible(true);
        setTimeout(() => {
            setContentVisible(true);
        }, 100)
        translateY.setValue(SCREEN_HEIGHT);
        
        
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            stiffness: 300,
            damping: 20,
            mass: 0.8,
        }).start();
    };

    const closeModal = () => {
        setContentVisible(false);
        setTimeout(() => {
            setModalVisible(false);
        }, 200);
        
        Animated.spring(translateY, {
            toValue: SCREEN_HEIGHT,
            useNativeDriver: true,
            stiffness: 300,
            damping: 25, 
            mass: 0.8,
        }).start();
    };

    useImperativeHandle(ref, () => ({
        openModal,
    }));
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                    closeModal();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        stiffness: 300,
                        damping: 20,
                        mass: 0.8,
                    }).start();
                }
            },
        })
    ).current;

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centeredContent}>
                    <ActivityIndicator size="large" color="#333" />
                </View>
            );
        }

        if (accounts && accounts.length > 0) {
            return accounts.map(account => (
                <TouchableOpacity
                    key={account.id}
                    style={styles.accountItem}
                    onPress={() => {
                        setSelectedAccount(account);
                        closeModal();
                    }}
                >
                    <TextMalet style={styles.accountName}>{account.name}</TextMalet>
                    <TextMalet style={styles.accountBalance}>${account.balance.toFixed(2)}</TextMalet>
                </TouchableOpacity>
            ));
        }

        return (
            <View style={styles.centeredContent}>
                <TextMalet style={styles.emptyText}>No tienes cuentas registradas.</TextMalet>
            </View>
        );
    };

    return (
        <Modal
            visible={modalVisible}
            transparent={true}
            animationType="none"
            onRequestClose={closeModal}
            statusBarTranslucent={true}
        >
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeModal} />
            
            <Animated.View
                style={[
                    styles.modalContainer,
                    { transform: [{ translateY }] }
                ]}
                {...panResponder.panHandlers}
            >
                {contentVisible && (
                    <>
                        <View style={styles.handle} />
                        <View style={styles.header}>
                            <View style={styles.headerTitleContainer}>
                                <IconAt width={20} height={20} />
                                <TextMalet style={styles.headerTitle}>Seleccionar cuenta</TextMalet>
                            </View>
                            <TouchableOpacity 
                                style={styles.addButton} 
                                onPress={() => {
                                    closeModal();
                                    router.push('/accounts/create');
                                }}
                            >
                                <TextMalet style={styles.addButtonText}>+</TextMalet>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.accountItem}
                            onPress={() => {
                                setSelectedAccount({
                                    id: '',
                                    name: '',
                                    balance: 0,
                                    currency: 'All',
                                    user_id: '',
                                    created_at: new Date(),
                                    updated_at: new Date()
                                });
                                closeModal();
                            }}
                        >
                            <TextMalet style={styles.accountName}>Todas las cuentas</TextMalet>
                            <TextMalet style={styles.accountBalance}>Presiona para ver las transacciones de todas las cuentas.</TextMalet>
                        </TouchableOpacity>
                        {renderContent()}
                    </>
                )}
            </Animated.View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: SCREEN_HEIGHT * 0.7,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    handle: {
        width: 50,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 5,
        alignSelf: 'center',
        marginVertical: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 22,
        color: '#333',
        lineHeight: 24,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accountItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    accountName: {
        fontSize: 16,
    },
    accountBalance: {
        fontSize: 14,
        color: '#666',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
    }
});

export default ModalAccounts;