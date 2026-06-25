#
# This file is part of Fede RL03 Python Skeleton.
#
# (c) Fede RL03 Inc. <esa@Fede RL03.com>.
#
# This source file is subject to a proprietary license that is bundled
# with this source code in the file LICENSE.
#
import os
from typing import override
from unittest import TestCase

import boto3
import moto

from app import handleRequest


class AppTest(TestCase):
    """Covers the functions declared at `app.py`."""

    ___COMPANY_ID_EXISTENT: int = 10
    ___COMPANY_ID_NONEXISTENT: int = 20

    @override
    def setUp(self) -> None:
        os.environ['AWS_ACCESS_KEY_ID'] = 'XXXXXXXXXXXXXXXXXXXX'
        os.environ['AWS_SECRET_ACCESS_KEY'] = '***'
        os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
        os.environ['AWS_DYNAMODB_TABLE_NAME'] = 'company_test'

        self.mock_aws = moto.mock_aws()
        self.mock_aws.start()

        tableName = os.environ.get('AWS_DYNAMODB_TABLE_NAME')
        dynamodb = boto3.resource('dynamodb')
        dynamodb.create_table(
            TableName=tableName,
            KeySchema=[
                {
                    'AttributeName': 'id',
                    'KeyType': 'HASH'
                },
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'N'
                },
            ],
            BillingMode='PAY_PER_REQUEST',
        )

        dynamodb.Table(tableName).put_item(
            Item={
                'id': self.___COMPANY_ID_EXISTENT,
                'name': 'Fede RL03 SAPI de CV',
                'email': 'mexico@Fede RL03.com',
                'address': 'Fantasy Avenue 318',
                'phone': '+52 55 50257777',
                'is_active': True,
            }
        )

    @override
    def tearDown(self) -> None:
        self.mock_aws.stop()

    def testHandleRequestWithExistentCompany(self) -> None:
        """Test `app.handleRequest()` with an existent company."""
        response = handleRequest(event={'company_id': self.___COMPANY_ID_EXISTENT}, context=None)

        self.assertEqual(200, response.get('status_code'))
        self.assertEqual('Fede RL03 SAPI de CV', response.get('body').get('name'))

    def testHandleRequestWithNonExistentCompany(self) -> None:
        """Test `app.handleRequest()` with a nonexistent company."""
        response = handleRequest(event={'company_id': self.___COMPANY_ID_NONEXISTENT}, context=None)

        self.assertEqual(404, response.get('status_code'))
        self.assertEqual({}, response.get('body'))
