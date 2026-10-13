import React, { useState } from 'react';
import { api } from '../../api/client';
import { Wallet, WithdrawalRecord } from '../../types';
import { X, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Shield, Check } from 'lucide-react';

interface WithdrawalModalProps {
  wallet: Wallet;
  onClose: () => void;
  onSuccess: (withdrawal: WithdrawalRecord) => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ wallet, onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [amount, setAmount] = useState<number>(1000);
  const [method, setMethod] = useState<'JazzCash' | 'Easypaisa'>('JazzCash');
  const [accountName, setAccountName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<WithdrawalRecord | null>(null);

  const amountOptions = [1000, 2500, 5000, 10000];

  const handleStep1Next = () => {
    setError(null);
    if (wallet.availableBalance < amount) {
      setError(
        `Insufficient available balance. Your balance is Rs. ${wallet.availableBalance.toLocaleString()}, but selected amount is Rs. ${amount.toLocaleString()}`
      );
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    setStep(3);
  };

  const handleStep3Next = () => {
    setError(null);
    if (!accountName.trim()) {
      setError('Please enter your account title / beneficiary name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError('Please enter a valid phone number for JazzCash / Easypaisa');
      return;
    }
    setStep(4);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.requestWithdrawal({
        amount,
        method,
        accountName: accountName.trim(),
        phone: phone.trim(),
      });
      setSubmittedRecord(res.withdrawal);
      onSuccess(res.withdrawal);
    } catch (err: any) {
      setError(err.message || 'Withdrawal submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Wizard Header */}
        <div className="mb-5">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Step {step} of 4 — Withdrawal Request
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Withdraw Funds</h2>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="flex items-center justify-between mb-6 px-1">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                  step === s
                    ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20'
                    : step > s
                    ? 'bg-emerald-900 text-emerald-300'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded ${
                    step > s ? 'bg-emerald-600' : 'bg-slate-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submittedRecord ? (
          <div className="p-6 bg-slate-950 rounded-2xl border border-emerald-500/30 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Withdrawal request submitted successfully.</h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 mt-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Processing Status: Pending</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-200">{submittedRecord.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-mono font-bold text-emerald-400">Rs. {submittedRecord.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <span className="font-bold text-slate-200">{submittedRecord.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account:</span>
                <span className="font-mono text-slate-200">{submittedRecord.phone}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            {/* STEP 1: SELECT AMOUNT */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Available Balance:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    Rs. {wallet.availableBalance.toLocaleString()}
                  </span>
                </div>

                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Withdrawal Amount
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {amountOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAmount(opt)}
                      className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        amount === opt
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-lg font-bold font-mono">Rs. {opt.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Instant Payout Request</div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="w-full mt-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-950/40"
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: SELECT PAYMENT METHOD */}
            {step === 2 && (
              <div className="space-y-4">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Choose Payment Gateway
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('JazzCash')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      method === 'JazzCash'
                        ? 'bg-red-500/10 border-red-500 text-red-200 ring-2 ring-red-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-red-500 mb-2" />
                    <div className="text-sm font-bold">JazzCash</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Mobile Account Transfer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('Easypaisa')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      method === 'Easypaisa'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mb-2" />
                    <div className="text-sm font-bold">Easypaisa</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Mobile Account Transfer</div>
                  </button>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStep2Next}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/40"
                  >
                    <span>Continue to Step 3</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ACCOUNT INFORMATION */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Account Name (Account Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. Muhammad Usman"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Must match exact name registered on your {method} account.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {method} Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStep3Next}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/40"
                  >
                    <span>Review Confirmation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CONFIRMATION SCREEN */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex justify-between text-xs pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Payment Method:</span>
                    <span className="font-bold text-white">{method}</span>
                  </div>
                  <div className="flex justify-between text-xs pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Withdrawal Amount:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      Rs. {amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Account Name:</span>
                    <span className="font-bold text-white">{accountName}</span>
                  </div>
                  <div className="flex justify-between text-xs pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Phone Number:</span>
                    <span className="font-bold font-mono text-white">{phone}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Processing Status:</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Pending
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Available balance will be deducted immediately into pending escrow.</span>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={isSubmitting}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
                  >
                    <span>{isSubmitting ? 'Submitting Request...' : 'SUBMIT WITHDRAWAL'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
