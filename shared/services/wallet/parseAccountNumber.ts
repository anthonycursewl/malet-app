export const parseAccountNumber = (number: string): string => {
    if (!number) return '';
    return number.replace(/(\d{4})/g, '$1 ').trim();
};