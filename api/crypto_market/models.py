#!/usr/bin/env python3
from dataclasses import dataclass
from typing import List

@dataclass
class Candle:
    ts: int       # timestamp (milliseconds)
    open: float
    high: float
    low: float
    close: float
    volume: float
