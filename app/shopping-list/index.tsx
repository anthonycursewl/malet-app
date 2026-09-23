import { InputField } from "@/components/AddWallet/InputField";
import Button from "@/components/Button/Button";
import ModalOptions from "@/components/shared/ModalOptions";
import TextMalet from "@/components/TextMalet/TextMalet";
import { currencies } from "@/shared/entities/Currencies";
import { ShoppingItem } from "@/shared/entities/ShoppingItem";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useShoppingListStore } from "@/shared/stores/useShoppingListStore";
import { useToastStore } from "@/shared/stores/useToastStore";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Plus, Receipt, Trash2 } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, PanResponder, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const currencyMap = new Map(currencies.map(c => [c.name, c]));

export default function ShoppingListScreen() {

    // Zustand global stores here.
    const items = useShoppingListStore(s => s.items);
    const loaded = useShoppingListStore(s => s.loaded);
    const load = useShoppingListStore(s => s.load);
    const addItem = useShoppingListStore(s => s.addItem);
    const togglePurchased = useShoppingListStore(s => s.togglePurchased);
    const removeItem = useShoppingListStore(s => s.removeItem);
    const fabX = useShoppingListStore(s => s.fabX);
    const fabY = useShoppingListStore(s => s.fabY);
    const setFabPosition = useShoppingListStore(s => s.setFabPosition);
    const convertToTransaction = useShoppingListStore(s => s.convertToTransaction);
    const accounts = useAccountStore(s => s.accounts);
    const getAllAccountsByUserId = useAccountStore(s => s.getAllAccountsByUserId);
    const addToast = useToastStore((s) => s.add);

    // Local states here 
    const [modalVisible, setModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [qty, setQty] = useState('1');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [convertModalVisible, setConvertModalVisible] = useState(false);
    const [selectedConvertAccount, setSelectedConvertAccount] = useState<string | null>(null);
    const [converting, setConverting] = useState(false);

    // Fab config
    const FAB_SIZE = 52;
    const FAB_MARGIN = 12;

    // Screen dimensions and initial FAB position
    const { width: screenW, height: screenH } = Dimensions.get('window');
    const initialX = fabX !== -999 && fabY !== -999 ? fabX : screenW - FAB_SIZE - FAB_MARGIN;
    const initialY = fabX !== -999 && fabY !== -999 ? fabY : screenH - 180;
    const fabPos = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
    const fabPosRef = useRef({ x: initialX, y: initialY });
    const dragBase = useRef({ x: 0, y: 0 });

    const depth = useRef(1);
    useEffect(() => {
        if (fabX === -999 && fabY === -999) {
            return;
        }
        fabPosRef.current = { x: fabX, y: fabY };
        Animated.spring(fabPos, {
            toValue: { x: fabX, y: fabY },
            useNativeDriver: true,
            damping: 12,
            stiffness: 150,
        }).start();
    }, [fabX, fabY]);

    const fabPan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
            onPanResponderGrant: () => {
                dragBase.current = { ...fabPosRef.current };
            },
            onPanResponderMove: (_, gs) => {
                const newX = Math.max(FAB_MARGIN, Math.min(dragBase.current.x + gs.dx, screenW - FAB_SIZE - FAB_MARGIN));
                const newY = Math.max(FAB_MARGIN, Math.min(dragBase.current.y + gs.dy, screenH - FAB_SIZE - FAB_MARGIN));
                fabPos.setValue({ x: newX, y: newY });
                fabPosRef.current = { x: newX, y: newY };
            },
            onPanResponderRelease: () => {
                setFabPosition(fabPosRef.current.x, fabPosRef.current.y);
                Animated.spring(fabPos, {
                    toValue: { x: fabPosRef.current.x, y: fabPosRef.current.y },
                    useNativeDriver: true,
                    damping: 12,
                    stiffness: 150,
                }).start();
            },
        })
    ).current;

    useEffect(() => {
        load();
        getAllAccountsByUserId();
    }, []);

    const listCurrency = useMemo(() => items.length > 0 ? items[0].currency : null, [items]);
    const purchasedCount = useMemo(() => items.filter(i => i.purchased).length, [items]);

    const handleConvert = async () => {
        if (!selectedConvertAccount) return;
        setConverting(true);
        const result = await convertToTransaction(selectedConvertAccount);
        setConverting(false);
        setConvertModalVisible(false);
        setSelectedConvertAccount(null);
        if (result) {
            addToast({
                type: 'success',
                message: `Factura creada: ${result.total.toFixed(2)} ${result.currency} (${result.archivedItemCount} artículos)`,
                duration: 4000,
            });
        } else {
            addToast({
                type: 'error',
                message: 'No hay artículos comprados para convertir',
                duration: 3000,
            });
        }
    };

    const totalsByCurrency = useMemo(() => {
        const map = new Map<string, number>();
        items.forEach(item => {
            const total = item.estimatedPrice * item.quantity;
            map.set(item.currency, (map.get(item.currency) || 0) + total);
        });
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    }, [items]);

    const grandTotalUSD = useMemo(() => {
        return items.reduce((sum, item) => {
            if (item.currency === 'USD') return sum + item.estimatedPrice * item.quantity;
            return sum;
        }, 0);
    }, [items]);

    const sanitizePrice = (text: string) => {
        const cleaned = text.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) return price;
        if (parts.length === 2 && parts[1].length > 2) return price;
        return cleaned;
    };

    const sanitizeQty = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned === '') return '';
        return String(parseInt(cleaned, 10) || 1);
    };

    const openAdd = () => {
        setName('');
        setPrice('');
        setQty('1');
        setSelectedCurrency(listCurrency || 'USD');
        setModalVisible(true);
    };

    const handleAdd = () => {
        if (!name.trim() || !price.trim()) return;
        addItem({
            name: name.trim(),
            quantity: Math.max(1, parseInt(qty, 10) || 1),
            estimatedPrice: parseFloat(price) || 0,
            currency: selectedCurrency,
            purchased: false,
        });
        setModalVisible(false);
    };

    if (!loaded) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <TextMalet style={styles.loadingText}>Cargando...</TextMalet>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerSide}>
                    <TextMalet style={styles.backText}>←</TextMalet>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <TextMalet style={styles.title}>Lista de Compras</TextMalet>
                    {listCurrency && (
                        <TextMalet style={styles.headerCurrency}>Moneda: {listCurrency}</TextMalet>
                    )}
                </View>
                <View style={styles.headerSide} />
            </View>

            {items.length === 0 ? (
                <View style={styles.center}>
                    <TextMalet style={styles.emptyTitle}>Tu lista está vacía</TextMalet>
                    <TextMalet style={styles.emptySubtitle}>Agrega artículos para empezar</TextMalet>
                </View>
            ) : (
                <>
                    <View style={styles.listWrapper}>
                        <FlashList
                            data={items}
                            keyExtractor={(item: ShoppingItem) => item.id}
                            contentContainerStyle={styles.list}
                            renderItem={({ item }: { item: ShoppingItem }) => (
                                <SwipeableRow onDelete={() => removeItem(item.id)}>
                                    <ShoppingItemRow
                                        item={item}
                                        onToggle={() => togglePurchased(item.id)}
                                    />
                                </SwipeableRow>
                            )}
                        />
                        <LinearGradient
                            colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
                            style={styles.listFadeTop}
                            pointerEvents="none"
                        />
                        <LinearGradient
                            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                            style={styles.listFadeBottom}
                            pointerEvents="none"
                        />
                    </View>
                    <View style={styles.footer}>
                        <ScrollView
                            style={styles.totalsScroll}
                            contentContainerStyle={styles.totalsBreakdown}
                            showsVerticalScrollIndicator={false}
                        >
                            {totalsByCurrency.map(([currency, total]) => {
                                const cur = currencyMap.get(currency);
                                return (
                                    <View key={currency} style={styles.totalRow}>
                                        <View style={styles.totalRowLeft}>
                                            {cur && (
                                                <Image source={{ uri: cur.img }} style={styles.totalFlag} />
                                            )}
                                            <TextMalet style={styles.totalRowCurrency}>{currency}</TextMalet>
                                        </View>
                                        <TextMalet style={styles.totalRowValue}>
                                            {total.toFixed(2)}
                                        </TextMalet>
                                    </View>
                                );
                            })}
                        </ScrollView>
                        <View style={styles.grandTotalRow}>
                            <TextMalet style={styles.grandTotalLabel}>Total USD</TextMalet>
                            <TextMalet style={styles.grandTotalValue}>
                                ${grandTotalUSD.toFixed(2)}
                            </TextMalet>
                        </View>
                        {purchasedCount > 0 && (
                            <Button
                                style={styles.convertButton}
                                onPress={() => {
                                    setConvertModalVisible(true);
                                    if (accounts.length > 0 && !selectedConvertAccount) {
                                        setSelectedConvertAccount(accounts[0].id);
                                    }
                                }}
                                icon={
                                    <Receipt size={16} color="#fff" />
                                }
                                text={`Convertir a factura (${purchasedCount})`}
                            />
                        )}
                    </View>
                </>
            )}

            <Animated.View
                style={[
                    styles.fab,
                    {
                        transform: [
                            { translateX: fabPos.x },
                            { translateY: fabPos.y },
                        ],
                    },
                ]}
                {...fabPan.panHandlers}
            >
                <TouchableOpacity onPress={openAdd} activeOpacity={0.7}>
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </Animated.View>

            <ModalOptions
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                heightRatio={0.50}
            >
                <View style={styles.modalBody}>
                    <TextMalet style={styles.modalTitle}>Nuevo artículo</TextMalet>

                    <View style={styles.fieldsGroup}>
                        <InputField
                            label="Nombre"
                            placeholder="Ej: Pan, Leche..."
                            value={name}
                            onChangeText={setName}
                        />

                        <View style={styles.qtyPriceRow}>
                            <View style={styles.qtyField}>
                                <InputField
                                    label="Cantidad"
                                    placeholder="1"
                                    value={qty}
                                    onChangeText={(v) => setQty(sanitizeQty(v))}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            <View style={styles.priceField}>
                                <InputField
                                    label="Precio"
                                    placeholder="0.00"
                                    value={price}
                                    onChangeText={(v) => setPrice(sanitizePrice(v))}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <TextMalet style={styles.currencyLabel}>Moneda</TextMalet>
                        {listCurrency ? (
                            <View style={styles.currencyLocked}>
                                <TextMalet style={styles.currencyLockedText}>{listCurrency}</TextMalet>
                                <TextMalet style={styles.currencyLockedHint}>La lista ya tiene artículos en esta moneda</TextMalet>
                            </View>
                        ) : (
                            <View style={styles.currencyScrollContainer}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.currencyScrollContent}
                                >
                                    {currencies.map(c => (
                                        <TouchableOpacity
                                            key={c.name}
                                            style={[styles.currencyChip, selectedCurrency === c.name && styles.currencyChipActive]}
                                            onPress={() => setSelectedCurrency(c.name)}
                                        >
                                            <Image source={{ uri: c.img }} style={styles.currencyFlag} />
                                            <TextMalet style={[styles.currencyChipText, selectedCurrency === c.name && styles.currencyChipTextActive]}>
                                                {c.name}
                                            </TextMalet>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <LinearGradient
                                    colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.currencyFadeLeft}
                                    pointerEvents="none"
                                />
                                <LinearGradient
                                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.currencyFadeRight}
                                    pointerEvents="none"
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                            <TextMalet style={styles.cancelText}>Cancelar</TextMalet>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, (!name.trim() || !price.trim()) && styles.submitButtonDisabled]}
                            onPress={handleAdd}
                            disabled={!name.trim() || !price.trim()}
                        >
                            <TextMalet style={styles.submitText}>Agregar</TextMalet>
                        </TouchableOpacity>
                    </View>
                </View>
            </ModalOptions>

            <ModalOptions
                visible={convertModalVisible}
                onClose={() => { if (!converting) setConvertModalVisible(false); }}
                heightRatio={0.50}
            >
                <View style={styles.modalBody}>
                    <TextMalet style={styles.modalTitle}>Convertir a factura</TextMalet>
                    <TextMalet style={styles.convertDesc}>
                        Se crear&aacute; una transacci&oacute;n con los {purchasedCount} art&iacute;culo{purchasedCount !== 1 ? 's' : ''} comprado{purchasedCount !== 1 ? 's' : ''}.
                    </TextMalet>

                    <TextMalet style={styles.currencyLabel}>Cuenta destino ({listCurrency})</TextMalet>
                    {listCurrency && accounts.filter(a => a.currency === listCurrency).length === 0 ? (
                        <View style={styles.noAccountCurrency}>
                            <TextMalet style={styles.noAccountCurrencyText}>
                                No tienes una cuenta en {listCurrency}. Crea una para poder convertir.
                            </TextMalet>
                        </View>
                    ) : (
                        <ScrollView style={styles.convertAccountList} showsVerticalScrollIndicator={false}>
                    {accounts.filter(a => !listCurrency || a.currency === listCurrency).map((acc) => (
                            <TouchableOpacity
                                key={acc.id}
                                style={[styles.convertAccountRow, selectedConvertAccount === acc.id && styles.convertAccountRowActive]}
                                onPress={() => setSelectedConvertAccount(acc.id)}
                            >
                                <View style={styles.convertAccountInfo}>
                                    <TextMalet style={[styles.convertAccountName, selectedConvertAccount === acc.id && styles.convertAccountNameActive]}>
                                        {acc.name}
                                    </TextMalet>
                                    <TextMalet style={styles.convertAccountBalance}>
                                        {acc.balance.toFixed(2)} {acc.currency}
                                    </TextMalet>
                                </View>
                                {selectedConvertAccount === acc.id && (
                                    <View style={styles.convertCheck}>
                                        <TextMalet style={styles.convertCheckText}>✓</TextMalet>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    )}

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => { if (!converting) setConvertModalVisible(false); }}
                            disabled={converting}
                        >
                            <TextMalet style={styles.cancelText}>Cancelar</TextMalet>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, (!selectedConvertAccount || converting) && styles.submitButtonDisabled]}
                            onPress={handleConvert}
                            disabled={!selectedConvertAccount || converting}
                        >
                            {converting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <TextMalet style={styles.submitText}>Convertir</TextMalet>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ModalOptions>
        </SafeAreaView>
    );
}

const SWIPE_THRESHOLD = -80;

const MAX_TOTALS_HEIGHT = 140;

const SwipeableRow = React.memo(({
    children,
    onDelete,
}: {
    children: React.ReactNode;
    onDelete: () => void;
}) => {
    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gs) =>
                Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
            onPanResponderMove: (_, gs) => {
                if (gs.dx < 0) {
                    translateX.setValue(Math.max(gs.dx, -120));
                }
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dx < SWIPE_THRESHOLD) {
                    Animated.timing(translateX, {
                        toValue: -120,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        onDelete();
                    });
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 8,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <View style={styles.swipeWrapper}>
            <View style={styles.deleteBackground}>
                <Trash2 size={20} color="#fff" />
            </View>
            <Animated.View
                style={[{ transform: [{ translateX }] }]}
                {...panResponder.panHandlers}
            >
                {children}
            </Animated.View>
        </View>
    );
});

const ShoppingItemRow = React.memo(({
    item,
    onToggle,
}: {
    item: ShoppingItem;
    onToggle: () => void;
}) => {
    const lineTotal = item.estimatedPrice * item.quantity;
    const cur = currencyMap.get(item.currency);

    return (
        <TouchableOpacity
            style={styles.itemRow}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <View style={styles.itemInfo}>
                    <TextMalet style={styles.itemName}>
                        {item.name}
                    </TextMalet>
                    <View style={styles.itemMeta}>
                        <TextMalet style={styles.itemDetail}>
                            {item.quantity}x ${item.estimatedPrice.toFixed(2)}
                        </TextMalet>
                        {cur && (
                            <View style={styles.itemCurrencyBadge}>
                                <Image source={{ uri: cur.img }} style={styles.itemCurrencyFlag} />
                                <TextMalet style={styles.itemCurrencyCode}>{item.currency}</TextMalet>
                            </View>
                        )}
                    </View>
                </View>
            </View>
            <TextMalet style={styles.itemTotal}>
                ${lineTotal.toFixed(2)}
            </TextMalet>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingText: {
        fontSize: 14,
        color: 'rgba(0,0,0,0.38)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    headerSide: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backText: {
        fontSize: 22,
        color: '#000',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.87)',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerCurrency: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.38)',
        marginTop: 1,
    },
    currencyLocked: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#f5f5f7',
        borderRadius: 8,
    },
    currencyLockedText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.6)',
    },
    currencyLockedHint: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.3)',
        flex: 1,
    },
    noAccountCurrency: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    noAccountCurrencyText: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.4)',
        textAlign: 'center',
        lineHeight: 18,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.6)',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(0,0,0,0.38)',
    },
    listWrapper: {
        flex: 1,
        position: 'relative',
        maxHeight: '70%',
    },
    list: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
    },
    listScroll: {
        flex: 1,
    },
    listFadeTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 24,
        zIndex: 1,
    },
    listFadeBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 24,
        zIndex: 1,
    },
    swipeWrapper: {
        marginBottom: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    deleteBackground: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 120,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e8e8ec',
        backgroundColor: '#fff',
    },
    itemRowPurchased: {
        opacity: 0.5,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#d0d0d8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    checkMark: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '700',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '500',
        color: 'rgba(0,0,0,0.87)',
        marginBottom: 3,
    },
    itemNamePurchased: {
        textDecorationLine: 'line-through',
        color: 'rgba(0,0,0,0.38)',
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemDetail: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.38)',
    },
    itemCurrencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: '#cfcffc',
        borderRadius: 12,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderStyle: 'dashed',
    },
    itemCurrencyFlag: {
        width: 12,
        height: 12,
    },
    itemCurrencyCode: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.5)',
    },
    itemTotal: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.87)',
    },
    itemTotalPurchased: {
        color: 'rgba(0,0,0,0.38)',
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#e8e8ec',
        backgroundColor: '#fff',
        maxHeight: '40%',
    },
    totalsScroll: {
        maxHeight: MAX_TOTALS_HEIGHT,
    },
    totalsBreakdown: {
        gap: 6,
        paddingBottom: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    totalFlag: {
        width: 20,
        height: 20,
    },
    totalRowCurrency: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(0,0,0,0.6)',
    },
    totalRowValue: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.87)',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e8e8ec',
    },
    grandTotalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    grandTotalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    fab: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    modalBody: {
        paddingTop: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.87)',
        marginBottom: 5,
    },
    fieldsGroup: {
        gap: 14,
    },
    qtyPriceRow: {
        flexDirection: 'row',
        gap: 12,
    },
    qtyField: {
        width: 100,
    },
    priceField: {
        flex: 1,
    },
    currencyLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.6)',
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    currencyScrollContainer: {
        position: 'relative',
        marginTop: 4,
    },
    currencyScrollContent: {
        gap: 8,
        paddingRight: 20,
    },
    currencyFadeLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 16,
        zIndex: 1,
    },
    currencyFadeRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 16,
        zIndex: 1,
    },
    currencyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e8e8ec',
    },
    currencyFlag: {
        width: 14,
        height: 14,
        borderRadius: 2,
    },
    currencyChipActive: {
        borderColor: '#ddceff',
        backgroundColor: '#f4effd',
    },
    currencyChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(0,0,0,0.38)',
    },
    currencyChipTextActive: {
        color: 'rgba(179, 113, 255, 0.87)',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
        marginBottom: -16,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#e8e8ec',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.6)',
    },
    submitButton: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 22,
        backgroundColor: '#000',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    convertButton: {
        marginTop: 12,
        paddingVertical: 11,
    },
    convertButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    convertDesc: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.5)',
        marginBottom: 16,
        lineHeight: 18,
    },
    convertAccountList: {
        maxHeight: 160,
        marginTop: 6,
        marginBottom: 8,
    },
    convertAccountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#e8e8ec',
    },
    convertAccountRowActive: {
        borderColor: '#1a1a2e',
        backgroundColor: '#f4f0ff',
    },
    convertAccountInfo: {
        flex: 1,
    },
    convertAccountName: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(0,0,0,0.87)',
    },
    convertAccountNameActive: {
        fontWeight: '600',
    },
    convertAccountBalance: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.38)',
        marginTop: 2,
    },
    convertCheck: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    convertCheckText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '700',
    },
});
