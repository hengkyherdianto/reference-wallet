# Copyright (c) The Diem Core Contributors
# SPDX-License-Identifier: Apache-2.0
import time

import context
import pytest
from diem import identifier, LocalAccount, offchain
from diem.offchain import (
    FundPullPreApprovalStatus,
)
from diem_utils.types.currencies import FiatCurrency, DiemCurrency
from tests.wallet_tests.resources.seeds.one_funds_pull_pre_approval import (
    OneFundsPullPreApproval,
)
from tests.wallet_tests.resources.seeds.one_user_seeder import OneUser
from wallet.services.account import (
    generate_new_subaddress,
    generate_sub_address,
)
from wallet.services.fund_pull_pre_approval import (
    create_and_approve,
    approve,
    Role,
    FundsPullPreApprovalError,
)
from wallet.services.offchain import (
    process_inbound_command,
)
from wallet.storage import (
    db_session,
    User,
    Account,
    get_funds_pull_pre_approval_command,
)
from wallet.types import RegistrationStatus

CID = "35a1b548-3170-438f-bf3a-6ca0fef85d15"
FUNDS_PULL_PRE_APPROVAL_ID = "5fc49fa0-5f2a-4faa-b391-ac1652c57e4d"
currency = DiemCurrency.XUS


def test_approve_but_no_command_in_db():
    with pytest.raises(FundsPullPreApprovalError, match=r"Could not find command .*"):
        approve(FUNDS_PULL_PRE_APPROVAL_ID, FundPullPreApprovalStatus.valid)


def test_approve_happy_flow():
    OneFundsPullPreApproval.run(
        db_session=db_session,
        funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
        status=FundPullPreApprovalStatus.pending,
    )

    command = get_funds_pull_pre_approval_command(FUNDS_PULL_PRE_APPROVAL_ID)

    assert command.status == FundPullPreApprovalStatus.pending

    approve(FUNDS_PULL_PRE_APPROVAL_ID, FundPullPreApprovalStatus.valid)

    command = get_funds_pull_pre_approval_command(FUNDS_PULL_PRE_APPROVAL_ID)

    assert command.status == FundPullPreApprovalStatus.valid


def test_approve_while_command_with_wrong_status_in_db():
    OneFundsPullPreApproval.run(
        db_session=db_session,
        funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
        status=FundPullPreApprovalStatus.closed,
    )

    with pytest.raises(
        FundsPullPreApprovalError, match=r"Could not approve command with status .*"
    ):
        approve(FUNDS_PULL_PRE_APPROVAL_ID, FundPullPreApprovalStatus.valid)


def test_approve_while_invalid_status():
    with pytest.raises(
        ValueError, match=r"Status must be 'valid' or 'rejected' and not '.*'"
    ):
        approve(FUNDS_PULL_PRE_APPROVAL_ID, FundPullPreApprovalStatus.closed)


def test_create_and_approve_happy_flow():
    command = get_funds_pull_pre_approval_command(FUNDS_PULL_PRE_APPROVAL_ID)

    assert command is None

    user = generate_mock_user()

    create_and_approve(
        account_id=user.account.id,
        biller_address=get_biller_address(user),
        funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
        funds_pull_pre_approval_type="consent",
        expiration_timestamp=int(time.time() + 30),
        max_cumulative_unit="week",
        max_cumulative_unit_value=1,
        max_cumulative_amount=10_000_000_000,
        max_cumulative_amount_currency=currency,
        max_transaction_amount=10_000,
        max_transaction_amount_currency=currency,
        description="test_establish_funds_pull_pre_approval_command_already_exist_in_db",
    )

    command = get_funds_pull_pre_approval_command(FUNDS_PULL_PRE_APPROVAL_ID)

    assert command.status == FundPullPreApprovalStatus.valid
    assert command.role == Role.PAYER


def generate_mock_user():
    user = User(
        username="test_user",
        registration_status=RegistrationStatus.Approved,
        selected_fiat_currency=FiatCurrency.USD,
        selected_language="en",
        password_salt="123",
        password_hash="deadbeef",
    )
    user.account = Account(name="test_user")
    db_session.add(user)
    db_session.commit()

    return user


def test_create_and_approve_with_expired_expiration_timestamp():
    command = get_funds_pull_pre_approval_command(FUNDS_PULL_PRE_APPROVAL_ID)

    assert command is None

    with pytest.raises(
        ValueError,
        match="expiration timestamp must be in the future",
    ):
        create_and_approve(
            account_id=1,
            biller_address=get_biller_address(),
            funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
            funds_pull_pre_approval_type="consent",
            expiration_timestamp=int(time.time() - 30),
            max_cumulative_unit="week",
            max_cumulative_unit_value=1,
            max_cumulative_amount=10_000_000_000,
            max_cumulative_amount_currency=currency,
            max_transaction_amount=10_000,
            max_transaction_amount_currency=currency,
            description="test_establish_funds_pull_pre_approval_command_already_exist_in_db",
        )


def test_create_and_approve_while_command_already_exist_in_db():
    OneFundsPullPreApproval.run(
        db_session=db_session,
        funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
        status=FundPullPreApprovalStatus.pending,
    )

    with pytest.raises(
        FundsPullPreApprovalError,
        match=f"Command with id {FUNDS_PULL_PRE_APPROVAL_ID} already exist in db",
    ):
        create_and_approve(
            account_id=1,
            biller_address=get_biller_address(),
            funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
            funds_pull_pre_approval_type="consent",
            expiration_timestamp=int(time.time() + 30),
            max_cumulative_unit="week",
            max_cumulative_unit_value=1,
            max_cumulative_amount=10_000_000_000,
            max_cumulative_amount_currency=currency,
            max_transaction_amount=10_000,
            max_transaction_amount_currency=currency,
            description="test_establish_funds_pull_pre_approval_command_already_exist_in_db",
        )


def test_process_inbound_command_basic_flow(
    monkeypatch,
):
    """
    Demonstrates the handling of incoming request with 'pending' status and no existing record exist in DB.
    Therefore, the incoming request is a new request which received from the payee
    """
    with monkeypatch.context() as m:
        client = context.get().offchain_client
        address = get_address()
        biller_address = get_biller_address()

        def mock(_request_sender_address: str, _request_body_bytes: bytes):
            return generate_funds_pull_pre_approval_command(
                address, biller_address, FUNDS_PULL_PRE_APPROVAL_ID
            )

        m.setattr(
            client,
            "process_inbound_request",
            mock,
        )
        cmd = generate_funds_pull_pre_approval_command(
            address, biller_address, FUNDS_PULL_PRE_APPROVAL_ID
        )
        code, resp = process_inbound_command(address, cmd)
        assert code == 200
        assert resp

    command_in_db = get_funds_pull_pre_approval_command(FUNDS_PULL_PRE_APPROVAL_ID)
    assert command_in_db
    assert command_in_db.biller_address == cmd.funds_pull_pre_approval.biller_address
    assert command_in_db.address == cmd.funds_pull_pre_approval.address
    assert command_in_db.status == cmd.funds_pull_pre_approval.status
    assert command_in_db.role == Role.PAYER


def test_process_inbound_command_update_immutable_value(
    monkeypatch,
):
    address = get_address()
    address_2 = get_address()
    biller_address = get_biller_address()

    OneFundsPullPreApproval.run(
        db_session=db_session,
        funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
        status=FundPullPreApprovalStatus.pending,
        address=address,
        biller_address=biller_address,
    )

    with monkeypatch.context() as m:
        client = context.get().offchain_client

        def mock(_request_sender_address: str, _request_body_bytes: bytes):
            return generate_funds_pull_pre_approval_command(
                address_2, biller_address, FUNDS_PULL_PRE_APPROVAL_ID
            )

        m.setattr(
            client,
            "process_inbound_request",
            mock,
        )

        with pytest.raises(
            ValueError, match="address and biller_addres values are immutable"
        ):
            cmd = generate_funds_pull_pre_approval_command(
                address_2, biller_address, FUNDS_PULL_PRE_APPROVAL_ID
            )
            process_inbound_command(address, cmd)

    command_in_db = get_funds_pull_pre_approval_command(FUNDS_PULL_PRE_APPROVAL_ID)
    # verify the original address not changed
    assert command_in_db.address == address


def test_process_inbound_command_valid_update(monkeypatch):
    address = get_address()
    biller_address = get_biller_address()

    OneFundsPullPreApproval.run(
        db_session=db_session,
        funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
        status=FundPullPreApprovalStatus.pending,
        address=address,
        biller_address=biller_address,
        max_cumulative_unit="month",
        max_cumulative_unit_value=2,
    )

    with monkeypatch.context() as m:
        client = context.get().offchain_client

        def mock(_request_sender_address: str, _request_body_bytes: bytes):
            return generate_funds_pull_pre_approval_command(
                address=address,
                biller_address=biller_address,
                funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
                max_cumulative_unit="week",
                max_cumulative_unit_value=1,
            )

        m.setattr(
            client,
            "process_inbound_request",
            mock,
        )
        cmd = generate_funds_pull_pre_approval_command(
            address, biller_address, FUNDS_PULL_PRE_APPROVAL_ID
        )
        code, resp = process_inbound_command(address, cmd)
        assert code == 200
        assert resp

    command_in_db = get_funds_pull_pre_approval_command(FUNDS_PULL_PRE_APPROVAL_ID)
    assert command_in_db
    assert command_in_db.biller_address == cmd.funds_pull_pre_approval.biller_address
    assert command_in_db.address == cmd.funds_pull_pre_approval.address
    assert command_in_db.status == cmd.funds_pull_pre_approval.status
    assert command_in_db.role == Role.PAYER
    assert command_in_db.max_cumulative_unit == "week"
    assert command_in_db.max_cumulative_unit_value == 1


def test_process_inbound_command_invalid_update(monkeypatch):
    address = get_address()
    biller_address = get_biller_address()

    OneFundsPullPreApproval.run(
        db_session=db_session,
        funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
        address=address,
        biller_address=biller_address,
    )

    with monkeypatch.context() as m:
        client = context.get().offchain_client

        def mock(_request_sender_address: str, _request_body_bytes: bytes):
            return generate_funds_pull_pre_approval_command(
                address=address,
                biller_address=biller_address,
                funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
            )

        m.setattr(
            client,
            "process_inbound_request",
            mock,
        )
        with pytest.raises(
            FundsPullPreApprovalError,
            match="Can't update existing command unless the status is 'pending'",
        ):
            cmd = generate_funds_pull_pre_approval_command(
                address, biller_address, FUNDS_PULL_PRE_APPROVAL_ID
            )
            process_inbound_command(address, cmd)

    command_in_db = get_funds_pull_pre_approval_command(FUNDS_PULL_PRE_APPROVAL_ID)
    # verify the original status not changed
    assert command_in_db.status == FundPullPreApprovalStatus.valid


def test_process_inbound_command_invalid_status(monkeypatch):
    address = get_address()
    biller_address = get_biller_address()

    with monkeypatch.context() as m:
        client = context.get().offchain_client

        def mock(_request_sender_address: str, _request_body_bytes: bytes):
            return generate_funds_pull_pre_approval_command(
                address=address,
                biller_address=biller_address,
                funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
                status=FundPullPreApprovalStatus.valid,
            )

        m.setattr(
            client,
            "process_inbound_request",
            mock,
        )
        with pytest.raises(
            FundsPullPreApprovalError,
            match="New incoming request must have 'pending' status",
        ):
            cmd = generate_funds_pull_pre_approval_command(
                address, biller_address, FUNDS_PULL_PRE_APPROVAL_ID
            )
            process_inbound_command(address, cmd)

    command_in_db = get_funds_pull_pre_approval_command(FUNDS_PULL_PRE_APPROVAL_ID)
    assert command_in_db is None


def get_biller_address(user=None):
    biller = LocalAccount.generate()
    biller_sub_address = generate_sub_address()

    if user:
        biller_sub_address = generate_new_subaddress(user.account_id)

    return identifier.encode_account(
        biller.account_address,
        biller_sub_address,
        context.get().config.diem_address_hrp(),
    )


def get_address():
    sender = LocalAccount.generate()
    sender_subaddress = identifier.gen_subaddress()
    return identifier.encode_account(
        sender.account_address,
        sender_subaddress,
        context.get().config.diem_address_hrp(),
    )


def generate_funds_pull_pre_approval_command(
    address,
    biller_address,
    funds_pull_pre_approval_id=FUNDS_PULL_PRE_APPROVAL_ID,
    max_cumulative_unit="week",
    max_cumulative_unit_value=1,
    status=FundPullPreApprovalStatus.pending,
):
    funds_pull_pre_approval = generate_fund_pull_pre_approval_object(
        address=address,
        biller_address=biller_address,
        funds_pull_pre_approval_id=funds_pull_pre_approval_id,
        max_cumulative_unit=max_cumulative_unit,
        max_cumulative_unit_value=max_cumulative_unit_value,
        status=status,
    )

    return offchain.FundsPullPreApprovalCommand(
        my_actor_address=address, funds_pull_pre_approval=funds_pull_pre_approval
    )


def generate_fund_pull_pre_approval_object(
    address,
    biller_address,
    funds_pull_pre_approval_id,
    max_cumulative_unit="week",
    max_cumulative_unit_value=1,
    status=FundPullPreApprovalStatus.pending,
):
    funds_pull_pre_approval = offchain.FundPullPreApprovalObject(
        funds_pull_pre_approval_id=funds_pull_pre_approval_id,
        address=address,
        biller_address=biller_address,
        scope=offchain.FundPullPreApprovalScopeObject(
            type=offchain.FundPullPreApprovalType.consent,
            expiration_timestamp=int(time.time()) + 30,
            max_cumulative_amount=offchain.ScopedCumulativeAmountObject(
                unit=max_cumulative_unit,
                value=max_cumulative_unit_value,
                max_amount=offchain.CurrencyObject(
                    amount=10_000_000_000_000, currency=currency
                ),
            ),
        ),
        status=status,
        description="test",
    )
    return funds_pull_pre_approval