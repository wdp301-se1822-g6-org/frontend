import { redirect } from 'next/navigation';

export default function PaymentCancelPage() {
  redirect('/profile/orders?payment=cancel');
}
