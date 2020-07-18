// Copyright (c) The Libra Core Contributors
// SPDX-License-Identifier: Apache-2.0

import React, {
  ComponentProps,
  ComponentType,
  createContext,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react";
import httpStatus from "http-status-codes";
import { NavigationComponentProps } from "react-native-navigation";
import SessionStorage from "../services/sessionStorage";
import BackendClient from "../services/backendClient";
import { BackendError } from "../services/errors";
import { FiatCurrency, LibraCurrency, Rates } from "../interfaces/currencies";

const REFRESH_TIMEOUT = 5000;

const initialRates = {
  LBR: {
    USD: 0,
    EUR: 0,
    GBP: 0,
    CHF: 0,
    CAD: 0,
    AUD: 0,
    NZD: 0,
    JPY: 0,
    LBR: 0,
    Coin1: 0,
    Coin2: 0,
  },
  Coin1: {
    USD: 0,
    EUR: 0,
    GBP: 0,
    CHF: 0,
    CAD: 0,
    AUD: 0,
    NZD: 0,
    JPY: 0,
    LBR: 0,
    Coin1: 0,
    Coin2: 0,
  },
  Coin2: {
    USD: 0,
    EUR: 0,
    GBP: 0,
    CHF: 0,
    CAD: 0,
    AUD: 0,
    NZD: 0,
    JPY: 0,
    LBR: 0,
    Coin1: 0,
    Coin2: 0,
  },
};

export const ratesContext = createContext<Rates | undefined>(undefined);

export const RatesProvider = ({ children }: PropsWithChildren<any>) => {
  const [rates, setRates] = useState<Rates>(initialRates);

  const timeoutRef = useRef<number>();

  async function loadRates() {
    const token = await SessionStorage.getAccessToken();
    if (!token) {
      return;
    }
    try {
      const backendClient = new BackendClient(token);
      const liquidityRates = await backendClient.getRates();

      const newRates = { ...rates };
      liquidityRates.forEach((rate) => {
        const [baseCurrency, counterCurrency] = rate.currency_pair.split("_");
        newRates[baseCurrency as LibraCurrency][counterCurrency as FiatCurrency | LibraCurrency] =
          rate.price;
      });

      setRates(newRates);
      timeoutRef.current = setTimeout(loadRates, REFRESH_TIMEOUT);
    } catch (e) {
      if (e instanceof BackendError && e.httpStatus === httpStatus.UNAUTHORIZED) {
        //
      } else {
        console.error(e);
      }
    }
  }

  useEffect(() => {
    loadRates();

    return () => {
      clearTimeout(timeoutRef.current!);
    };
  }, []);

  return <ratesContext.Provider value={rates} children={children} />;
};

export const withRatesContext = (
  WrappedComponent: ComponentType<NavigationComponentProps & any>
) => (props: ComponentProps<any>) => (
  <RatesProvider>
    <WrappedComponent {...props} />
  </RatesProvider>
);