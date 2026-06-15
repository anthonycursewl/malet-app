import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useRef, useState } from "react";
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

    // Pending filter state (what's shown in the modal)
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

    // Applied filter values (what's actually used in API calls)
    const appliedFiltersRef = useRef({
        types: [] as string[],
        startDate: null as Date | null,
        endDate: null as Date | null,
        deleted: false,
    });
    const [appliedFilterActive, setAppliedFilterActive] = useState(false);

    const handleOpenModal = useCallback(() => setModalVisible(true), []);
    const handleCloseModal = useCallback(() => setModalVisible(false), []);

    const openFilterModal = useCallback(() => {
        const a = appliedFiltersRef.current;
        setFilterTypes(a.types);
        setStartDate(a.startDate);
        setEndDate(a.endDate);
        setFilterDeleted(a.deleted);
        setFilterModalVisible(true);
    }, []);

    const closeFilterModal = useCallback(() => {
        setFilterModalVisible(false);
    }, []);

    const doFetch = useCallback(async (params: {
        refresh: boolean;
        types?: string;
        startDate?: string;
        endDate?: string;
        deleted?: boolean;
        tags?: string;
    }) => {
        if (!selectedAccount?.id) return;
        setIsRefreshingData(true);
        await getHistoryTransactions(selectedAccount.id, user.id, params);
        setIsRefreshingData(false);
    }, [selectedAccount?.id, user.id, getHistoryTransactions]);

    const handleRefresh = useCallback(async () => {
        const a = appliedFiltersRef.current;
        await doFetch({
            refresh: true,
            types: a.types.length > 0 ? a.types.join(',') : undefined,
            startDate: a.startDate?.toISOString(),
            endDate: a.endDate?.toISOString(),
            tags: debouncedTags,
        });
    }, [doFetch, debouncedTags]);

    const handleEndReached = useCallback(() => {
        if (loadingWallet || paginationTransactions.isEnd) return;
        const a = appliedFiltersRef.current;
        getHistoryTransactions(selectedAccount?.id || '', user.id, {
            refresh: false,
            types: a.types.length > 0 ? a.types.join(',') : undefined,
            startDate: a.startDate?.toISOString(),
            endDate: a.endDate?.toISOString(),
            tags: debouncedTags,
        });
    }, [loadingWallet, paginationTransactions.isEnd, selectedAccount?.id, user.id, getHistoryTransactions, debouncedTags]);

    useEffect(() => {
        const interactionPromise = InteractionManager.runAfterInteractions(() => {
            setIsReady(true);
        });
        return () => {
            interactionPromise.cancel();
            useWalletStore.setState({ transactions: [], paginationTransactions: { cursor: null, take: 10, isEnd: false } });
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

    // Auto-fetch when tags change (uses applied filters from ref)
    useEffect(() => {
        if (!isReady || firstMount) return;
        const a = appliedFiltersRef.current;
        doFetch({
            refresh: true,
            types: a.types.length > 0 ? a.types.join(',') : undefined,
            startDate: a.startDate?.toISOString(),
            endDate: a.endDate?.toISOString(),
            deleted: a.deleted,
            tags: debouncedTags,
        });
    }, [debouncedTags]);

    // Initial fetch on mount or account change
    useEffect(() => {
        if (!isReady) return;

        const getData = async () => {
            if (selectedAccount?.id) {
                setFirstMount(true);
                contentFadeAnim.setValue(0);
                useWalletStore.setState({ transactions: [], paginationTransactions: { cursor: null, take: 10, isEnd: false } });

                await doFetch({
                    refresh: true,
                    types: undefined,
                    startDate: undefined,
                    endDate: undefined,
                    deleted: undefined,
                    tags: undefined,
                });

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

    const applyFilters = async () => {
        closeFilterModal();

        appliedFiltersRef.current = {
            types: filterTypes,
            startDate,
            endDate,
            deleted: filterDeleted,
        };
        setAppliedFilterActive(
            filterTypes.length > 0 ||
            startDate !== null ||
            endDate !== null ||
            filterDeleted
        );

        await doFetch({
            refresh: true,
            types: filterTypes.length > 0 ? filterTypes.join(',') : undefined,
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
            deleted: filterDeleted,
            tags: debouncedTags,
        });
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
        setFilterDeleted(false);
        setSelectedTags([]);
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

    const hasActiveFilters = appliedFilterActive || selectedTags.length > 0;
    const showSkeleton = !isReady || (firstMount && selectedAccount?.id);

    return {
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

        toggleBalanceHidden,
        setModalVisible,
        openFilterModal,
        closeFilterModal,
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

        hasActiveFilters,
        buttonText: selectedAccount ? `${selectedAccount.name} ${selectedAccount.currency}` : 'Seleccionar cuenta'
    };
}
