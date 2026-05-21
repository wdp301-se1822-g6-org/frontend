'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useRef } from 'react';
import { Camera, AlertCircle, X, Loader2, ShieldCheck, ShieldAlert, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useSendOtp } from '@/hooks/auth/useSendOtp';
import { useVerifyOtp } from '@/hooks/auth/useVerifyOtp';

export default function ProfilePage() {
  const authUser = useAuthStore((s) => s.authUser);
  const getUser = useAuthStore((s) => s.getUser);
  const setUser = useAuthStore((s) => s.setUser);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    day: '',
    month: '',
    year: '',
  });

  const [showAlert, setShowAlert] = useState(true);
  
  // OTP Verification States
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();

  // Check email verification status defensively
  const isEmailVerified = !!(
    authUser?.isEmailVerified || 
    authUser?.isVerified || 
    authUser?.emailVerified
  );

  useEffect(() => {
    if (authUser) {
      const dob = authUser.dateOfBirth ? new Date(authUser.dateOfBirth) : null;
      setFormData({
        name: authUser.name || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        day: dob ? dob.getDate().toString() : '',
        month: dob ? (dob.getMonth() + 1).toString() : '',
        year: dob ? dob.getFullYear().toString() : '',
      });
    }
  }, [authUser]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const initials =
    authUser?.name
      ?.split(' ')
      .map((w: string) => w[0])
      .slice(-2)
      .join('')
      .toUpperCase() ?? '?';

  // Handle Trigger OTP Send & Open Modal
  const handleStartVerification = async () => {
    if (!authUser?.email) {
      toast.error('Không tìm thấy địa chỉ email của bạn.');
      return;
    }
    try {
      setIsSendingOtp(true);
      await sendOtpMutation.mutateAsync({ email: authUser.email });
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
      setIsOtpModalOpen(true);
      toast.success('Mã OTP xác thực đã được gửi tới email!');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || '';
      const isRateLimit = 
        err?.response?.status === 429 || 
        /wait|sent|limit|cooldown|gửi|chờ|thử lại/i.test(errMsg);

      if (isRateLimit) {
        // Vẫn mở Modal để ông chủ nhập mã OTP đã được gửi trước đó vào email
        setOtpValues(['', '', '', '', '', '']);
        setIsOtpModalOpen(true);
        setCountdown(60);
        toast.info(errMsg || 'Mã xác thực đã được gửi trước đó. Vui lòng kiểm tra email của bạn!');
      } else {
        toast.error(errMsg || 'Không thể gửi mã OTP. Vui lòng thử lại.');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };


  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!authUser?.email || countdown > 0) return;
    try {
      await sendOtpMutation.mutateAsync({ email: authUser.email });
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
      toast.success('Mã OTP mới đã được gửi lại!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể gửi lại mã OTP.');
    }
  };

  // Handle OTP Inputs Change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    const newValues = [...otpValues];
    newValues[index] = value.slice(-1);
    setOtpValues(newValues);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle OTP Backspace key
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle OTP Verification submission
  const handleVerifyOtp = async () => {
    const code = otpValues.join('');
    if (code.length !== 6) {
      toast.error('Vui lòng điền đầy đủ 6 chữ số của mã OTP.');
      return;
    }
    if (!authUser?.email) return;

    try {
      setIsVerifying(true);
      const res = await verifyOtpMutation.mutateAsync({
        email: authUser.email,
        code,
      });

      // Extract new token if returned by verification API
      const resData = res?.data || res;
      const newToken = resData?.token || resData?.accessToken;
      
      if (newToken) {
        useAuthStore.getState().setAccessToken(newToken);
      }

      // Reload global user info from backend
      await getUser();
      
      // Proactively persist the verification status locally in authUser store
      // to ensure UI badge updates immediately and remains verified.
      const currentAuthUser = useAuthStore.getState().authUser;
      if (currentAuthUser) {
        setUser({
          ...currentAuthUser,
          isEmailVerified: true,
          isVerified: true,
          emailVerified: true,
        });
      }
      
      toast.success('Tài khoản của bạn đã được xác thực thành công!');
      setIsOtpModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className='space-y-4'>
      {/* Update Alert */}
      {showAlert && (
        <div className='bg-[#FFFBF2] border border-[#F9E1B2] rounded-md p-4 flex items-center justify-between text-[#856404] text-sm'>
          <div className='flex items-center gap-3'>
            <AlertCircle className='w-4 h-4 text-orange-400' />
            <span>Tính năng thay đổi thông tin cá nhân sắp được ra mắt.</span>
          </div>
          <button onClick={() => setShowAlert(false)} className='text-muted-foreground hover:text-foreground'>
            <X className='w-4 h-4' />
          </button>
        </div>
      )}

      <Card className='border-none shadow-xl shadow-black/5 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-md'>
        <CardContent className='p-8'>
          <div className='mb-8 border-b border-border pb-4'>
            <h1 className='text-xl font-bold text-foreground'>Hồ Sơ Của Tôi</h1>
            <p className='text-sm text-muted-foreground'>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-12'>
            {/* Form Left */}
            <div className='lg:col-span-8 space-y-6'>

              <div className='grid grid-cols-3 items-center gap-4'>
                <Label className='text-right text-muted-foreground font-medium'>Tên</Label>
                <div className='col-span-2'>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className='rounded-xl border-border/50 bg-white/50 focus:bg-white transition-all'
                  />
                </div>
              </div>

              {/* Email Verification Row */}
              <div className='grid grid-cols-3 items-center gap-4'>
                <Label className='text-right text-muted-foreground font-medium'>Email</Label>
                <div className='col-span-2 flex flex-wrap items-center gap-3'>
                  <span className='text-foreground font-semibold'>
                    {formData.email.replace(/(.{2}).+(@.+)/, '$1******$2')}
                  </span>
                  
                  {isEmailVerified ? (
                    <div className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 transition-all duration-300'>
                      <ShieldCheck className='w-3.5 h-3.5' />
                      Đã xác thực
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <div className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 transition-all duration-300 animate-pulse'>
                        <ShieldAlert className='w-3.5 h-3.5' />
                        Chưa xác thực
                      </div>
                      
                      <Button
                        type='button'
                        size='sm'
                        onClick={handleStartVerification}
                        disabled={isSendingOtp}
                        className='h-7 rounded-lg text-xs bg-primary hover:bg-primary/95 text-white font-medium shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97]'
                      >
                        {isSendingOtp ? (
                          <>
                            <Loader2 className='w-3 h-3 animate-spin mr-1' />
                            Đang gửi...
                          </>
                        ) : (
                          'Xác thực ngay'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-3 items-center gap-4'>
                <Label className='text-right text-muted-foreground font-medium'>Số điện thoại</Label>
                <div className='col-span-2 flex items-center gap-2'>
                  <span className='text-foreground'>{formData.phone.replace(/(.{3}).+(.{2})/, '$1********$2')}</span>
                  <button className='text-xs text-blue-600 hover:underline'>Thay Đổi</button>
                </div>
              </div>

              <div className='grid grid-cols-3 items-center gap-4'>
                <Label className='text-right text-muted-foreground font-medium'>Ngày sinh</Label>
                <div className='col-span-2 flex gap-3'>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className='flex-1 h-10 px-3 rounded-xl border border-border/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none'
                  >
                    <option value=''>Ngày</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className='flex-1 h-10 px-3 rounded-xl border border-border/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none'
                  >
                    <option value=''>Tháng</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}> {m}</option>
                    ))}
                  </select>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className='flex-1 h-10 px-3 rounded-xl border border-border/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none'
                  >
                    <option value=''>Năm</option>
                    {Array.from({ length: 100 }, (_, i) => 2024 - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-3 items-center gap-4 pt-4'>
                <div />
                <div className='col-span-2'>
                  <Button
                    disabled={isLoading}
                    onClick={async () => {
                      setIsLoading(true);
                      await new Promise(r => setTimeout(r, 800)); // Simulate API call
                      setIsLoading(false);
                      toast.success('Cập nhật hồ sơ thành công!');
                    }}
                    className='bg-primary hover:bg-primary/90 text-white px-10 py-6 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]'
                  >
                    {isLoading ? <Loader2 className='w-5 h-5 animate-spin' /> : 'Lưu'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Avatar Right */}
            <div className='lg:col-span-4 flex flex-col items-center justify-start pt-4 border-l border-border/50 space-y-4'>
              <div className='relative group'>
                <div className='w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-muted flex items-center justify-center group-hover:opacity-90 transition-all'>
                  {authUser?.avatarUrl ? (
                    <img
                      src={authUser.avatarUrl}
                      alt='Avatar'
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <span className='text-3xl font-black text-muted-foreground/40'>{initials}</span>
                  )}

                  <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
                    <Camera className='w-8 h-8 text-white' />
                  </div>
                </div>
              </div>

              <Button variant='outline' className='rounded-xl border-border/50 hover:bg-primary/5 hover:text-primary transition-all font-semibold'>
                Chọn Ảnh
              </Button>

              <div className='text-center space-y-1'>
                <p className='text-xs text-muted-foreground'>Dung lượng file tối đa 1 MB</p>
                <p className='text-xs text-muted-foreground'>Định dạng:.JPEG, .PNG</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Glassmorphic OTP Verification Modal */}
      {isOtpModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in'>
          <div 
            className='relative w-full max-w-md p-8 overflow-hidden bg-white/90 border border-white/40 shadow-2xl rounded-3xl backdrop-blur-xl animate-scale-up transition-all'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsOtpModalOpen(false)}
              className='absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors'
            >
              <X className='w-5 h-5' />
            </button>

            {/* Header */}
            <div className='flex flex-col items-center text-center space-y-3 mb-6'>
              <div className='p-3 bg-primary/10 text-primary rounded-2xl'>
                <KeyRound className='w-8 h-8' />
              </div>
              <h2 className='text-xl font-bold text-foreground'>Xác Thực Tài Khoản</h2>
              <p className='text-sm text-muted-foreground max-w-xs'>
                Nhập mã OTP gồm 6 chữ số vừa được gửi đến hòm thư điện tử <br />
                <span className='font-semibold text-foreground/80'>{authUser?.email}</span>
              </p>
            </div>

            {/* OTP Inputs */}
            <div className='flex justify-center gap-2.5 mb-6' dir='ltr'>
              {otpValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type='text'
                  inputMode='numeric'
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className='w-12 h-14 text-center text-xl font-bold rounded-xl border border-border/70 bg-white/50 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all duration-200'
                />
              ))}
            </div>

            {/* Error Message placeholder or action buttons */}
            <div className='space-y-4 text-center'>
              <Button
                onClick={handleVerifyOtp}
                disabled={isVerifying}
                className='w-full py-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all'
              >
                {isVerifying ? (
                  <>
                    <Loader2 className='w-5 h-5 animate-spin mr-2' />
                    Đang xác thực...
                  </>
                ) : (
                  'Xác Nhận'
                )}
              </Button>

              {/* Countdown or Resend */}
              <div className='flex items-center justify-center gap-1.5 text-sm'>
                {countdown > 0 ? (
                  <p className='text-muted-foreground'>
                    Gửi lại mã sau <span className='text-primary font-bold'>{countdown}s</span>
                  </p>
                ) : (
                  <div className='flex items-center gap-1'>
                    <p className='text-muted-foreground'>Không nhận được mã?</p>
                    <button
                      onClick={handleResendOtp}
                      className='text-primary hover:underline font-bold transition-all'
                    >
                      Gửi lại ngay
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
