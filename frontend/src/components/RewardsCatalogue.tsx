import React, { useState } from 'react';
import { Reward, CoinBalance } from '../types';
import { formatCoins } from '../lib/formatters';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Coins, Gift, CheckCircle2, Sparkles, Tag, ShoppingBag, Utensils, Zap, Plane } from 'lucide-react';

interface RewardsCatalogueProps {
  rewards: Reward[];
  balance: CoinBalance | null;
  isLoading: boolean;
  onRedeem: (rewardId: string) => Promise<void>;
  isRedeeming: boolean;
}

export const RewardsCatalogue: React.FC<RewardsCatalogueProps> = ({
  rewards,
  balance,
  isLoading,
  onRedeem,
  isRedeeming,
}) => {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [successModalData, setSuccessModalData] = useState<{
    rewardName: string;
    newBalance: number;
  } | null>(null);

  const coinBalance = balance?.coin_balance ?? 0;

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;
    try {
      await onRedeem(selectedReward.id);
      setSuccessModalData({
        rewardName: selectedReward.name,
        newBalance: coinBalance - selectedReward.coin_cost,
      });
      setSelectedReward(null);
    } catch {
      // Error is caught and surfaced via toast in parent
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'shopping':
        return <ShoppingBag className="w-6 h-6 text-indigo-600" />;
      case 'food':
        return <Utensils className="w-6 h-6 text-orange-600" />;
      case 'cashback':
        return <Zap className="w-6 h-6 text-amber-600" />;
      case 'travel':
        return <Plane className="w-6 h-6 text-cyan-600" />;
      default:
        return <Gift className="w-6 h-6 text-indigo-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-36 bg-slate-200 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Coin Balance Wallet Card */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <Coins className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              Finora Loyalty Vault
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatCoins(coinBalance)}{' '}
              <span className="text-amber-200 text-2xl sm:text-3xl font-semibold">Coins</span>
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-md">
              Earn coins on every successful transaction. Instant redemption with zero processing fees.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center min-w-[160px]">
            <span className="block text-xs uppercase text-amber-200 font-semibold tracking-wider">
              Available Rewards
            </span>
            <span className="block text-2xl font-bold mt-0.5">{rewards.length} Offers</span>
          </div>
        </div>
      </div>

      {/* Rewards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Catalogue Vouchers</h3>
            <p className="text-xs text-slate-500">Choose a voucher to redeem instantly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => {
            const isAffordable = coinBalance >= reward.coin_cost;
            const coinsNeeded = reward.coin_cost - coinBalance;

            return (
              <Card
                key={reward.id}
                className="flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50/50 transition-colors">
                      {getRewardIcon(reward.reward_type)}
                    </div>
                    <Badge variant="amber" className="font-bold">
                      {formatCoins(reward.coin_cost)} Coins
                    </Badge>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-1">{reward.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{reward.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  {isAffordable ? (
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold"
                      onClick={() => setSelectedReward(reward)}
                    >
                      Redeem Voucher
                    </Button>
                  ) : (
                    <div className="w-full text-center">
                      <Button
                        variant="secondary"
                        size="md"
                        disabled
                        className="w-full bg-slate-100 text-slate-400 font-medium"
                      >
                        Need {formatCoins(coinsNeeded)} more coins
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedReward && (
        <Modal
          isOpen={!!selectedReward}
          onClose={() => setSelectedReward(null)}
          title="Confirm Reward Redemption"
          footer={
            <>
              <Button variant="ghost" onClick={() => setSelectedReward(null)} disabled={isRedeeming}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmRedeem}
                isLoading={isRedeeming}
                className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
              >
                Confirm & Spend {formatCoins(selectedReward.coin_cost)} Coins
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-lg">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-amber-800 font-medium">Redeeming Voucher</p>
                <p className="text-base font-bold text-amber-950">{selectedReward.name}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span>Current Balance:</span>
                <span className="font-semibold">{formatCoins(coinBalance)} Coins</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Voucher Cost:</span>
                <span className="font-semibold">-{formatCoins(selectedReward.coin_cost)} Coins</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900 text-sm">
                <span>Remaining Balance:</span>
                <span className="text-emerald-600">
                  {formatCoins(coinBalance - selectedReward.coin_cost)} Coins
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Success Modal */}
      {successModalData && (
        <Modal
          isOpen={!!successModalData}
          onClose={() => setSuccessModalData(null)}
          title="Redemption Successful!"
          footer={
            <Button variant="primary" onClick={() => setSuccessModalData(null)} className="w-full">
              Done
            </Button>
          }
        >
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Voucher Issued</h3>
            <p className="text-xs text-slate-600">
              You have successfully redeemed <span className="font-semibold">{successModalData.rewardName}</span>!
            </p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
              New Coin Balance: {formatCoins(successModalData.newBalance)} Coins
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
