import { redirect } from 'next/navigation';

export default function PaymentSuccessPage() {
  redirect('/profile/orders?payment=success');
}
