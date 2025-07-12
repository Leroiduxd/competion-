import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

/* ---------- Supabase ---------- */
const supabaseUrl = 'https://yaikidiqvtxiqtrawvgf.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/* ---------- Blockchain ---------- */
const RPC_URL         = 'https://testnet.dplabs-internal.com';
const CONTRACT_ADDRESS = '0xbb24da1f6aaa4b0cb3ff9ae971576790bb65673c';

const ABI = [
  {
    inputs: [{ internalType: 'address', name: 'trader', type: 'address' }],
    name: 'getTraderPnL',
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const contract  = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

/* ---------- Core logic ---------- */
export async function updateTraders () {
  // 1. Récupérer les adresses à mettre à jour
  const { data: traders, error } = await supabase.from('traders').select('address');
  if (error) {
    console.error('Erreur Supabase :', error);
    return { success: false, message: error.message };
  }

  // 2. Pour chaque adresse, appeler getTraderPnL et mettre à jour la table
  for (const { address } of traders) {
    try {
      const rawPnl = await contract.getTraderPnL(address); // int256

      // Les contrats retournent souvent des valeurs 1e6 / 1e18 : adapter si besoin
      const pnl = Number(rawPnl.toString()) / 1e6;

      await supabase.from('traders').upsert(
        [{
          address,
          pnl,
          updated_at: new Date().toISOString()
        }],
        { onConflict: ['address'] }
      );

      console.log(`✔️ ${address} – PnL = ${pnl}`);
    } catch (err) {
      console.error(`❌ ${address} –`, err.message);
    }
  }

  return { success: true, message: 'Tous les traders sont mis à jour.' };
}
