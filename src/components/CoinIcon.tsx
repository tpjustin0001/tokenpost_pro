'use client';

import React from 'react';
import Image from 'next/image';

// CoinGecko CDN for coin icons
const COIN_ICON_MAP: Record<string, string> = {
    'BTC': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    'XRP': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    'ADA': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    'DOGE': 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    'DOT': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
    'AVAX': 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
    'SHIB': 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
    'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
    'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
    'ATOM': 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
    'LTC': 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
    'UNI': 'https://assets.coingecko.com/coins/images/12504/small/uniswap.png',
    'ARB': 'https://assets.coingecko.com/coins/images/16547/small/arb.jpg',
    'OP': 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
    'APT': 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
    'SUI': 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
    'NEAR': 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
    'FTM': 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png',
    'INJ': 'https://assets.coingecko.com/coins/images/12882/small/Secondary_Symbol.png',
    'TIA': 'https://assets.coingecko.com/coins/images/31967/small/tia.jpg',
    'SEI': 'https://assets.coingecko.com/coins/images/28205/small/Sei_Logo_-_Transparent.png',
    'PEPE': 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
    'WIF': 'https://assets.coingecko.com/coins/images/33566/small/dogwifhat.jpg',
    'BONK': 'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg',
    'MEME': 'https://assets.coingecko.com/coins/images/32528/small/meme.png',
    'ORDI': 'https://assets.coingecko.com/coins/images/30162/small/ordi.png',
    'STX': 'https://assets.coingecko.com/coins/images/2069/small/Stacks_logo_full.png',
    'AAVE': 'https://assets.coingecko.com/coins/images/12645/small/aave-token.png',
    'MKR': 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png',
    'CRV': 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',
    'SNX': 'https://assets.coingecko.com/coins/images/3406/small/SNX.png',
    'TON': 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
    'TRX': 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
    'HBAR': 'https://assets.coingecko.com/coins/images/3688/small/hbar.png',
    'VET': 'https://assets.coingecko.com/coins/images/1167/small/VeChain-Logo-768x725.png',
    'FIL': 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
    'ICP': 'https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png',
};

// Get fallback icon URL using CryptoCompare as backup
function getFallbackUrl(symbol: string): string {
    return `https://www.cryptocompare.com/media/37746251/${symbol.toLowerCase()}.png`;
}

interface CoinIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

export default function CoinIcon({ symbol, size = 24, className = '' }: CoinIconProps) {
    const upperSymbol = symbol.toUpperCase();
    const iconUrl = COIN_ICON_MAP[upperSymbol] || getFallbackUrl(upperSymbol);

    return (
        <Image
            src={iconUrl}
            alt={`${symbol} icon`}
            width={size}
            height={size}
            className={className}
            style={{ borderRadius: '50%' }}
            unoptimized
            onError={(e) => {
                // If icon fails to load, show a fallback colored circle with initial
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
            }}
        />
    );
}

// Helper function to get icon URL directly (for non-React contexts)
export function getCoinIconUrl(symbol: string): string {
    const upperSymbol = symbol.toUpperCase();
    return COIN_ICON_MAP[upperSymbol] || getFallbackUrl(upperSymbol);
}

// Fallback component when image fails to load
export function CoinIconFallback({ symbol, size = 24 }: { symbol: string; size?: number }) {
    const colors: Record<string, string> = {
        'BTC': '#F7931A',
        'ETH': '#627EEA',
        'SOL': '#9945FF',
        'BNB': '#F3BA2F',
        'XRP': '#23292F',
        'ADA': '#0033AD',
        'DOGE': '#C2A633',
        'AVAX': '#E84142',
        'SHIB': '#FFA409',
        'LINK': '#2A5ADA',
    };

    const bgColor = colors[symbol.toUpperCase()] || '#6366f1';

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: size * 0.5,
                fontWeight: 600,
            }}
        >
            {symbol.substring(0, 1).toUpperCase()}
        </div>
    );
}
