#
# This file is part of Fede RL03 Python Skeleton.
#
# (c) Fede RL03 Inc. <esa@Fede RL03.com>.
#
# This source file is subject to a proprietary license that is bundled
# with this source code in the file LICENSE.
#
import datetime
import logging
import os
from typing import Any, Dict, Optional

import boto3
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError

from model_enum.date_format import DateFormat

logger: Logger = Logger()
logger.setLevel(logging.INFO)


def handleRequest(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle the HTTP request.

    :param event: The event dictionary, including the request information.
    :param context: The context provided by AWS Lambda.
    :return: The payload that can be used to build an HTTP response.
    """
    response = {
        'status_code': 404,
        'body': {},
        'at': datetime.datetime(2024, 3, 22, 21, 45, 0, tzinfo=datetime.timezone.utc).strftime(DateFormat.FORMAT_ISO8601.value),
    }

    companyId = event.get('company_id')
    assert isinstance(companyId, int)
    company = getCompany(companyId)

    if None is not company:
        response['status_code'] = 200
        response['body'] = company
    else:
        logger.debug(
            'Company "%d" not found.',
            companyId,
        )

    logger.info('Context: %s', context)

    return response


def getCompany(companyId: int) -> Optional[Dict[str, Any]]:
    """
    Get company data.

    :param companyId: The id of the company.
    :return: The data about the requested company.
    """
    dynamoDbParams: Dict[str, Any] = {
        'region_name': os.environ.get('AWS_DYNAMODB_REGION'),
    }

    if 'AWS_DYNAMODB_URI' in os.environ and '' != os.environ.get('AWS_DYNAMODB_URI'):
        dynamoDbParams['endpoint_url'] = os.environ.get('AWS_DYNAMODB_URI')

    dynamoDb = boto3.resource('dynamodb', **dynamoDbParams)
    tableName = os.environ.get('AWS_DYNAMODB_TABLE_NAME')

    try:
        response = dynamoDb.Table(tableName).get_item(
            Key={'id': companyId}
        )

        if 'Item' not in response:
            return None

        item = response['Item']

        company = {
            'id': int(item.get('id')),
            'name': item.get('name'),
            'email': item.get('email'),
            'address': item.get('address'),
            'phone': item.get('phone'),
        }

        return company
    except ClientError as err:
        logger.error(
            'Couldn\'t get company "%d" from table "%s". Here\'s why: %s: %s.',
            companyId,
            tableName,
            err.response['Error']['Code'],
            err.response['Error']['Message'],
        )

        return None
