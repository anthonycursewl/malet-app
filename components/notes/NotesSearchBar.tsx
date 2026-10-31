import { Search } from 'lucide-react-native';
import { memo, useEffect, useRef, useState } from 'react';
import { InputField } from '@/components/AddWallet/InputField';

interface NotesSearchBarProps {
    initialValue?: string;
    onSearch: (value: string) => void;
}

/**
 * Mismo InputField de siempre, pero con el texto aislado y debounce para que
 * escribir no re-renderice el feed completo en cada tecla.
 */
const NotesSearchBar = memo(function NotesSearchBar({
    initialValue = '',
    onSearch,
}: NotesSearchBarProps) {
    const [value, setValue] = useState(initialValue);
    const lastSent = useRef(initialValue.trim());

    useEffect(() => {
        const trimmed = value.trim();
        if (trimmed === lastSent.current) return;

        const timer = setTimeout(() => {
            if (trimmed === lastSent.current) return;
            lastSent.current = trimmed;
            onSearch(trimmed);
        }, 300);

        return () => clearTimeout(timer);
    }, [value, onSearch]);

    return (
        <InputField
            label="Buscar"
            placeholder="Buscar en tus notas..."
            value={value}
            onChangeText={setValue}
            icon={<Search size={16} color="#666" />}
            autoCapitalize="none"
        />
    );
});

export default NotesSearchBar;
