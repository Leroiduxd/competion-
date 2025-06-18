
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://yaikidiqvtxiqtrawvgf.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const RPC_URL = "https://testnet.dplabs-internal.com";
const CONTRACT_ADDRESS = "0xbb24da1f6aaa4b0cb3ff9ae971576790bb65673c";

const ABI = [{
  "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
  "name": "getClosedPositions",
  "outputs": [{
    "components": [
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "uint256", "name": "assetIndex", "type": "uint256"},
      {"internalType": "uint256", "name": "entryPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "closePrice", "type": "uint256"},
      {"internalType": "uint256", "name": "usdSize", "type": "uint256"},
      {"internalType": "uint256", "name": "leverage", "type": "uint256"},
      {"internalType": "bool", "name": "isLong", "type": "bool"},
      {"internalType": "int256", "name": "pnl", "type": "int256"},
      {"internalType": "uint256", "name": "openTimestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "closeTimestamp", "type": "uint256"},
      {"internalType": "string", "name": "reason", "type": "string"}
    ],
    "internalType": "struct Brokex.ClosedPosition[]",
    "name": "",
    "type": "tuple[]"
  }],
  "stateMutability": "view",
  "type": "function"
}];

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

async function updateTraders() {
  const { data: traders, error } = await supabase.from('traders').select('address');
  if (error) {
    console.error("Error fetching traders:", error);
    return;
  }

  for (const trader of traders) {
    try {
      const positions = await contract.getClosedPositions(trader.address);
      const pnlTotal = positions.reduce((sum, pos) => sum + Number(pos.pnl.toString()), 0);
      const nbTrades = positions.length;

      await supabase.from('traders').upsert([{
        address: trader.address,
        pnl: pnlTotal / 1e6,
        nb_trades: nbTrades,
        updated_at: new Date().toISOString()
      }], { onConflict: ['address'] });

      console.log(`Updated ${trader.address}: PnL=${pnlTotal / 1e6}, Trades=${nbTrades}`);
    } catch (err) {
      console.error(`Error processing ${trader.address}:`, err.message);
    }
  }
}

updateTraders();
