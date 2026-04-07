import { currencies } from "@/shared/entities/Currencies";

export const getCurrencyIcon = (code?: string): string => {
  const currencyCode = code || 'USD';
  const currency = currencies.find(c => c.name === currencyCode);

  if (currency) {
    return currency.img;
  }

  const usdCurrency = currencies.find(c => c.name === 'USD');
  return usdCurrency ? usdCurrency.img : '';
};
