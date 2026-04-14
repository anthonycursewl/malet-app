import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, InteractionManager, Platform } from 'react-native';

export function useTransactions() {
    const { user } = useAuthStore();
    const [firstMount, setFirstMount] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const {
        getHistoryTransactions,
        loading: loadingWallet,
        transactions,
        paginationTransactions,
        clearStore
    } = useWalletStore();

    const {
        accounts,
        error,
        getAllAccountsByUserId,
        selectedAccount,
        isBalanceHidden,
        toggleBalanceHidden
    } = useAccountStore();

    const [modalVisible, setModalVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [filterTypes, setFilterTypes] = useState<string[]>([]);
    const [filterDeleted, setFilterDeleted] = useState<boolean>(false);

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [datePickerType, setDatePickerType] = useState<'start' | 'end' | null>(null);

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [debouncedTags, setDebouncedTags] = useState<string | undefined>(undefined);
    const [isRefreshingData, setIsRefreshingData] = useState(false);
    const debounceRef = useRef<any>(null);

    const contentFadeAnim = useRef(new Animated.Value(0)).current;

    const activeFilterTypesStr = useMemo(() => filterTypes.length > 0 ? filterTypes.join(',') : undefined, [filterTypes]);
    const activeStartDateStr = useMemo(() => startDate ? startDate.toISOString() : undefined, [startDate]);
    const activeEndDateStr = useMemo(() => endDate ? endDate.toISOString() : undefined, [endDate]);
    // Tags was handled by useMemo, we'll now use the debounced value for fetching.

    const handleOpenModal = useCallback(() => setModalVisible(true), []);
    const handleCloseModal = useCallback(() => setModalVisible(false), []);

    const handleRefresh = useCallback(async () => {
        if (selectedAccount?.id) {
            setIsRefreshingData(true);
            await getHistoryTransactions(selectedAccount.id, user.id, {
                refresh: true,
                types: activeFilterTypesStr,
                startDate: activeStartDateStr,
                endDate: activeEndDateStr,
                tags: debouncedTags
            });
            setIsRefreshingData(false);
        }
    }, [selectedAccount?.id, user.id, getHistoryTransactions, activeFilterTypesStr, activeStartDateStr, activeEndDateStr, debouncedTags]);

    const handleEndReached = useCallback(() => {
        if (loadingWallet || paginationTransactions.isEnd) {
            return;
        }
        if (selectedAccount?.id) {
            getHistoryTransactions(selectedAccount.id, user.id, {
                refresh: false,
                types: activeFilterTypesStr,
                startDate: activeStartDateStr,
                endDate: activeEndDateStr,
                tags: debouncedTags
            });
        }
    }, [loadingWallet, paginationTransactions.isEnd, selectedAccount?.id, user.id, getHistoryTransactions, activeFilterTypesStr, activeStartDateStr, activeEndDateStr, debouncedTags]);

    useEffect(() => {
        const interactionPromise = InteractionManager.runAfterInteractions(() => {
            setIsReady(true);
        });
        return () => {
            interactionPromise.cancel();
            clearStore();
        };
    }, []);

    useEffect(() => {
        if (error) {
            Alert.alert('Malet | Error', error);
        }
    }, [error]);

    useEffect(() => {
        if (!isReady) return;
        if (accounts.length === 0) {
            getAllAccountsByUserId({ refresh: true });
        }
    }, [isReady, accounts.length, getAllAccountsByUserId]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            setDebouncedTags(selectedTags.length > 0 ? selectedTags.join(',') : undefined);
        }, 600);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [selectedTags]);

    useEffect(() => {
        if (!isReady) return;

        const getData = async () => {
            if (selectedAccount?.id) {
                setFirstMount(true);
                contentFadeAnim.setValue(0);
                clearStore();

                setIsRefreshingData(true);
                await getHistoryTransactions(selectedAccount.id, user.id, {
                    refresh: true,
                    types: activeFilterTypesStr,
                    startDate: activeStartDateStr,
                    endDate: activeEndDateStr,
                    tags: debouncedTags
                });
                setIsRefreshingData(false);

                setFirstMount(false);
                Animated.timing(contentFadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            } else {
                setFirstMount(false);
                Animated.timing(contentFadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            }
        };

        getData();
    }, [isReady, selectedAccount?.id, user.id]);

    useEffect(() => {
        if (!isReady || firstMount) return;

        const updateFilters = async () => {
            if (selectedAccount?.id) {
                setIsRefreshingData(true);
                await getHistoryTransactions(selectedAccount.id, user.id, {
                    refresh: true,
                    types: activeFilterTypesStr,
                    startDate: activeStartDateStr,
                    endDate: activeEndDateStr,
                    tags: debouncedTags
                });
                setIsRefreshingData(false);
            }
        };

        updateFilters();
    }, [activeFilterTypesStr, activeStartDateStr, activeEndDateStr, debouncedTags]);

    const applyFilters = () => {
        setFilterModalVisible(false);
        if (selectedAccount?.id && isReady) {
            setIsRefreshingData(true);
            getHistoryTransactions(selectedAccount.id, user.id, {
                refresh: true,
                types: activeFilterTypesStr,
                deleted: filterDeleted,
                startDate: activeStartDateStr,
                endDate: activeEndDateStr,
                tags: debouncedTags
            }).finally(() => setIsRefreshingData(false));
        }
    };

    const toggleFilterType = (type: string) => {
        if (filterTypes.includes(type)) {
            setFilterTypes(prev => prev.filter(t => t !== type));
        } else {
            setFilterTypes(prev => [...prev, type]);
        }
    };

    const onDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate;
        if (Platform.OS === 'android') {
            setDatePickerType(null);
        }
        if (currentDate) {
            if (datePickerType === 'start') {
                setStartDate(currentDate);
                if (endDate && currentDate > endDate) {
                    setEndDate(null);
                }
            } else if (datePickerType === 'end') {
                setEndDate(currentDate);
                if (startDate && currentDate < startDate) {
                    setStartDate(null);
                }
            }
        }
    }, [datePickerType, endDate, startDate]);

    const clearFilters = () => {
        setFilterTypes([]);
        setStartDate(null);
        setEndDate(null);
    };

    const onToggleTag = useCallback((tagName: string) => {
        if (selectedTags.length > 19) return
        setSelectedTags(prev => {
            if (prev.includes(tagName)) {
                return prev.filter(t => t !== tagName);
            }
            return [...prev, tagName];
        });
    }, []);

    const hasActiveFilters = filterTypes.length > 0 || startDate !== null || endDate !== null;
    const showSkeleton = !isReady || (firstMount && selectedAccount?.id);

    return {
        // State
        isReady,
        loadingWallet,
        isFiltering: isRefreshingData && !firstMount,
        transactions,
        paginationTransactions,
        selectedAccount,
        isBalanceHidden,
        modalVisible,
        filterModalVisible,
        filterTypes,
        startDate,
        endDate,
        datePickerType,
        selectedTags,
        contentFadeAnim,
        showSkeleton,

        // Handlers
        toggleBalanceHidden,
        setModalVisible,
        setFilterModalVisible,
        setDatePickerType,
        handleOpenModal,
        handleCloseModal,
        handleRefresh,
        handleEndReached,
        applyFilters,
        toggleFilterType,
        onDateChange,
        clearFilters,
        setStartDate,
        setEndDate,
        onToggleTag,
        setFilterDeleted,
        filterDeleted,

        // Derived
        hasActiveFilters,
        buttonText: selectedAccount ? `${selectedAccount.name} ${selectedAccount.currency}` : 'Seleccionar cuenta'
    };
}
