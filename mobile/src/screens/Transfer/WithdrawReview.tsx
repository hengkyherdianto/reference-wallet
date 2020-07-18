// Copyright (c) The Libra Core Contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Navigation, NavigationComponentProps } from "react-native-navigation";
import { Button, Text, ThemeConsumer } from "react-native-elements";
import { useTranslation } from "react-i18next";
import { userContext, withUserContext } from "../../contexts/user";
import { accountContext, withAccountContext } from "../../contexts/account";
import ScreenLayout from "../../components/ScreenLayout";
import { appTheme } from "../../styles";
import { ratesContext, withRatesContext } from "../../contexts/rates";
import { Quote } from "../../interfaces/cico";
import { paymentMethodsLabels } from "../../interfaces/user";
import { fiatCurrencies, libraCurrencies } from "../../currencies";
import {
  fiatToHumanFriendly,
  fiatToHumanFriendlyRate,
  libraToHumanFriendly,
} from "../../utils/amount-precision";
import { FiatCurrency, LibraCurrency } from "../../interfaces/currencies";
import BackendClient from "../../services/backendClient";
import SessionStorage from "../../services/sessionStorage";
import { BackendError } from "../../services/errors";
import ErrorMessage from "../../components/Messages/ErrorMessage";

type SubmitStatuses = "edit" | "sending" | "fail" | "success";

interface WithdrawReviewProps {
  quote: Quote;
  fundingSourceId: number;
}

function WithdrawReview({
  quote,
  fundingSourceId,
  componentId,
}: WithdrawReviewProps & NavigationComponentProps) {
  const { t } = useTranslation("transfer");

  const user = useContext(userContext);
  const account = useContext(accountContext);
  const rates = useContext(ratesContext);

  const [errorMessage, setErrorMessage] = useState<string>();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatuses>("edit");

  async function handleSubmit() {
    try {
      setSubmitStatus("sending");
      const token = await SessionStorage.getAccessToken();
      await new BackendClient(token).executeQuote(quote.quoteId, fundingSourceId);
      setSubmitStatus("success");
    } catch (e) {
      setSubmitStatus("fail");
      if (e instanceof BackendError) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage("Internal Error");
        console.error("Unexpected Error", e);
      }
    }
  }

  async function goToRoot() {
    await Navigation.popToRoot(componentId);
  }

  async function goBack() {
    await Navigation.pop(componentId);
  }

  return (
    <ScreenLayout componentId={componentId}>
      <ThemeConsumer<typeof appTheme>>
        {({ theme }) => (
          <>
            {user && account && rates ? (
              <>
                {(() => {
                  const fundingSource = user.paymentMethods!.find(
                    (paymentMethod) => paymentMethod.id == fundingSourceId
                  )!;

                  const [libraCurrencyCode, fiatCurrencyCode] = quote.rfq.currency_pair.split("_");
                  const libraCurrency = libraCurrencies[libraCurrencyCode as LibraCurrency];
                  const fiatCurrency = fiatCurrencies[fiatCurrencyCode as FiatCurrency];

                  const exchangeRate =
                    rates[libraCurrencyCode as LibraCurrency][fiatCurrencyCode as FiatCurrency];

                  return (
                    <View style={theme.Container}>
                      {errorMessage && <ErrorMessage message={errorMessage} />}

                      <View style={theme.Section}>
                        <Text h1>{t("withdraw.review.title")}</Text>
                        <Text>{t("withdraw.review.description")}</Text>
                      </View>

                      <View style={theme.Section}>
                        <Text>{t("withdraw.review.funding_source")}</Text>
                        <Text style={{ color: "black" }}>
                          {fundingSource.name}{" "}
                          <Text>{paymentMethodsLabels[fundingSource.provider]}</Text>
                        </Text>
                      </View>

                      <View style={theme.Section}>
                        <Text>{t("withdraw.review.amount")}</Text>
                        <Text style={{ color: "black" }}>
                          {libraToHumanFriendly(quote.rfq.amount, true)} {libraCurrency.sign}
                        </Text>
                      </View>

                      <View style={theme.Section}>
                        <Text>{t("withdraw.review.price")}</Text>
                        <Text style={{ color: "black" }}>
                          {fiatCurrency.sign}
                          {fiatToHumanFriendly(quote.price, true)} {fiatCurrency.symbol}
                        </Text>
                      </View>

                      <View style={theme.Section}>
                        <Text>{t("withdraw.review.exchange_rate")}</Text>
                        <Text style={{ color: "black" }}>
                          1 {libraCurrency.sign} = {fiatToHumanFriendlyRate(exchangeRate)}{" "}
                          {fiatCurrency.symbol}
                        </Text>
                      </View>

                      {submitStatus !== "success" && (
                        <>
                          <Button
                            containerStyle={theme.Section}
                            title={t("withdraw.review.confirm")}
                            disabled={submitStatus === "sending"}
                            onPress={handleSubmit}
                          />
                          <Button
                            type="outline"
                            title={t("withdraw.review.back")}
                            disabled={submitStatus === "sending"}
                            onPress={goBack}
                          />
                        </>
                      )}
                      {submitStatus === "success" && (
                        <>
                          <Button title={t("withdraw.review.done")} onPress={goToRoot} />
                        </>
                      )}
                    </View>
                  );
                })()}
              </>
            ) : (
              <ActivityIndicator size="large" />
            )}
          </>
        )}
      </ThemeConsumer>
    </ScreenLayout>
  );
}

export default withRatesContext(withAccountContext(withUserContext(WithdrawReview)));