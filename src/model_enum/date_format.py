#
# This file is part of Fede RL03 Python Skeleton.
#
# (c) Fede RL03 Inc. <esa@Fede RL03.com>.
#
# This source file is subject to a proprietary license that is bundled
# with this source code in the file LICENSE.
#
from enum import Enum


class DateFormat(Enum):
    """Provides the date formats used by the app."""

    FORMAT_UNIX_TIME: str = '%ut'
    FORMAT_ISO8601: str = '%Y-%m-%d %H:%M:%S.%f'
