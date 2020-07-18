// Copyright (c) The Libra Core Contributors
// SPDX-License-Identifier: Apache-2.0

import React, { FormEvent, useState } from "react";

import { Button, Container, Form, FormGroup, FormText, Input } from "reactstrap";
import BackendClient from "../services/backendClient";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { BackendError } from "../services/errors";
import SessionStorage from "../services/sessionStorage";
import ErrorMessage from "../components/Messages/ErrorMessage";

function Signup() {
  const { t } = useTranslation("auth");

  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [submitStatus, setSubmitStatus] = useState<"edit" | "sending" | "fail" | "success">("edit");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);

  const passwordStrengthRegex = new RegExp("^(?=.*\\d)(?=.*[a-zA-Z]).{8,}$");
  const backendClient = new BackendClient();

  const onFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordStrengthRegex.test(password)) {
      return setErrorMessage(t("fields.password_strength.error"));
    }

    try {
      setErrorMessage(undefined);
      setSubmitStatus("sending");
      const token = await backendClient.signupUser(email, password);
      SessionStorage.storeAccessToken(token);
      setSubmitStatus("success");
    } catch (e) {
      setSubmitStatus("fail");
      if (e instanceof BackendError) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage("Internal Error");
        console.error("Unexpected error", e);
      }
    }
  };

  return (
    <>
      <Container className="py-5 d-flex flex-column">
        <section className="slim-section m-auto">
          {errorMessage && <ErrorMessage message={errorMessage} />}

          {submitStatus === "success" && (
            <>
              <h1 className="h3">{t("signup.success.headline")}</h1>
              <p>{t("signup.success.text", { replace: { email } })}</p>
            </>
          )}

          {submitStatus !== "success" && (
            <>
              <h1 className="h3">{t("signup.headline")}</h1>
              <p>
                <Trans
                  t={t}
                  i18nKey="signup.text"
                  components={[<Link to="/login" />]}
                  values={{ name: t("layout:name") }}
                />
              </p>

              <Form role="form" onSubmit={onFormSubmit}>
                <FormGroup className="mb-4">
                  <Input
                    placeholder={t("fields.email")}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FormGroup>
                <FormGroup className="mb-4">
                  <Input
                    placeholder={t("fields.password")}
                    type="password"
                    autoComplete="off"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </FormGroup>
                {!!password.length && (
                  <FormText className="mb-4">
                    <strong>{t("fields.password_strength.title")}:</strong>{" "}
                    {passwordStrengthRegex.test(password) ? (
                      <span className="text-success">{t("fields.password_strength.strong")}</span>
                    ) : (
                      <span className="text-danger">{t("fields.password_strength.weak")}</span>
                    )}
                    <div>{t("fields.password_strength.text")}</div>
                  </FormText>
                )}
                <div className="mb-4 custom-control custom-control-alternative custom-checkbox">
                  <input
                    className="custom-control-input"
                    id="agree-terms-and-conditions"
                    type="checkbox"
                    required
                    value={agreedTerms ? 1 : 0}
                    onChange={() => setAgreedTerms(!agreedTerms)}
                  />
                  <label className="custom-control-label" htmlFor="agree-terms-and-conditions">
                    <span>
                      <Trans t={t} i18nKey="fields.agree_terms">
                        I agree to the <Link to="#">Terms and Conditions</Link>
                      </Trans>
                    </span>
                  </label>
                </div>
                {submitStatus === "sending" && (
                  <Button color="black" type="button" block disabled>
                    <i className="fa fa-spin fa-spinner" />
                  </Button>
                )}
                {submitStatus !== "sending" && (
                  <Button color="black" type="submit" block>
                    {t("signup.submit")}
                  </Button>
                )}
              </Form>
            </>
          )}
        </section>
      </Container>
    </>
  );
}

export default Signup;