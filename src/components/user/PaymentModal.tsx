import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { uploadPaymentScreenshot, validateFile } from '../../api/storage';
import { PaymentSettings, PackageOffer } from '../../types';
import { X, Upload, CheckCircle2, AlertCircle, Copy, Check, QrCode, ArrowRight, Zap, Crown } from 'lucide-react';

interface PaymentModalProps {
  packageOffer: PackageOffer;
  onClose: () => void;
  onSuccess: (openPage2?: boolean) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ packageOffer, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'JazzCash' | 'Easypaisa'>('JazzCash');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInstantBuying, setIsInstantBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    api
      .getPaymentDetails()
      .then((settings) => setPaymentSettings(settings))
      .catch((err) => console.error('Failed to load payment details:', err));
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate using storage utility (type + size <= 10MB)
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file format or size');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotData(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!senderName.trim()) {
      setError('Please provide your sender account name');
      return;
    }
    if (!senderPhone.trim()) {
      setError('Please provide your sender phone number');
      return;
    }
    if (!screenshotData) {
      setError('Please upload your payment transfer receipt screenshot');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let finalProofUrl = screenshotData;

      // Upload to Backend Storage
      try {
        if (selectedFile) {
          finalProofUrl = await uploadPaymentScreenshot(
            selectedFile,
            user?.id || 'guest',
            (percent) => setUploadProgress(percent)
          );
        } else if (screenshotData) {
          finalProofUrl = await uploadPaymentScreenshot(
            screenshotData,
            user?.id || 'guest',
            (percent) => setUploadProgress(percent)
          );
        }
      } catch (storageErr: any) {
        console.warn('Backend storage upload notice:', storageErr);
        finalProofUrl = screenshotData;
      }

      await api.purchasePackage({
        packageId: packageOffer.id,
        paymentMethod: selectedMethod,
        senderAccountName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        transactionProofUrl: finalProofUrl,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Payment submission failed');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleInstantBuy = async () => {
    setError(null);
    setIsInstantBuying(true);
    try {
      await api.instantBuyPackage(packageOffer.id);
      onSuccess(true); // Open Page 2 directly
      onClose();
    } catch (err: any) {
      setError(err.message || 'Instant package purchase failed');
    } finally {
      setIsInstantBuying(false);
    }
  };

  const currentMethodDetails =
    selectedMethod === 'JazzCash' ? paymentSettings?.jazzCash : paymentSettings?.easypaisa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Payment Verification
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {packageOffer.name} Package — Rs. {packageOffer.price.toLocaleString()}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Follow official payment instructions below. Account details are dynamically verified by administration.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-6 sm:p-8 text-center bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Payment Verification Submitted</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your payment screenshot and transaction details have been dispatched to the administrator.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <span className="text-amber-400 font-bold block mb-1">Next Step:</span>
              Once verified by administrator, Page 2 (Invite Friends) will unlock automatically. You can also view Page 2 now.
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
              <button
                onClick={() => {
                  onSuccess(true); // Open Page 2
                  onClose();
                }}
                className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
              >
                <span>OPEN PAGE 2 (INVITE FRIENDS)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  onSuccess(false);
                  onClose();
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick 1-Click Buy & Open Page 2 Button (Hidden) */}
            <div className="hidden p-3 rounded-2xl bg-gradient-to-r from-emerald-950/50 to-teal-950/40 border border-emerald-500/30 items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Instant Purchase Mode
                </span>
                <p className="text-[11px] text-slate-300 font-medium">
                  Buy {packageOffer.name} and open Page 2 immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={handleInstantBuy}
                disabled={isInstantBuying}
                className="shrink-0 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
              >
                <span>{isInstantBuying ? 'Activating...' : 'Buy & Open Page 2'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Or Select Manual Payment Gateway
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('JazzCash')}
                  className={`py-3 px-4 rounded-xl font-semibold text-xs transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                    selectedMethod === 'JazzCash'
                      ? 'bg-red-500/10 border-red-500/50 text-red-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>JazzCash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('Easypaisa')}
                  className={`py-3 px-4 rounded-xl font-semibold text-xs transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                    selectedMethod === 'Easypaisa'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Easypaisa</span>
                </button>
              </div>
            </div>

            {/* Official Credentials Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <span className="text-[11px] font-semibold uppercase text-slate-400">Official Account</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  Fee: Rs. {packageOffer.price.toLocaleString()}
                </span>
              </div>

              {currentMethodDetails ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2 space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Account Title</span>
                      <div className="text-xs font-bold text-slate-200">
                        {currentMethodDetails.accountName}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Account Number</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold font-mono text-emerald-300">
                          {currentMethodDetails.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentMethodDetails.accountNumber, 'num')}
                          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          title="Copy account number"
                        >
                          {copiedField === 'num' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                      {currentMethodDetails.instructions}
                    </p>
                  </div>

                  {/* QR Code Container */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <img
                      src={currentMethodDetails.qrCode}
                      alt="Official Payment QR"
                      className="w-24 h-24 rounded-lg object-contain"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
                      <QrCode className="w-3 h-3 text-emerald-400" />
                      Scan QR
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-2">Loading payment credentials...</div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* User Submission Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Sender Account Name
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Ali Raza"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Sender Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="0301-2345678"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Upload Screenshot */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Upload Payment Screenshot
              </label>
              <div className="border border-dashed border-slate-700 rounded-2xl p-4 bg-slate-950/60 text-center relative hover:border-emerald-500/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {screenshotData ? (
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src={screenshotData}
                      alt="Payment Receipt Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-emerald-500/40"
                    />
                    <div className="text-left">
                      <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Receipt Attached
                      </div>
                      <span className="text-[10px] text-slate-500">Click to change screenshot</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                    <div className="text-xs font-medium text-slate-300">
                      Tap to select or upload payment screenshot
                    </div>
                    <span className="text-[10px] text-slate-500">PNG, JPG or JPEG up to 10MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status note */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status after submit:</span>
              <span className="font-semibold text-amber-400">Payment Verification Pending</span>
            </div>

            {/* Storage Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="space-y-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between text-[11px] text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Uploading to Backend Storage...
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-200 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold rounded-2xl text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Uploading & Verifying...' : 'SUBMIT PAYMENT & PROCEED'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
