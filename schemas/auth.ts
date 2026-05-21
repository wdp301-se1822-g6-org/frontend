import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const registerSchema = z
  .object({
    email: z.email('Vui lòng nhập đúng định dạng email'),

    password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự'),

    name: z
      .string()
      .min(2, 'Họ tên cần ít nhất 2 ký tự')
      .max(50, 'Họ tên tối đa 50 ký tự'),

    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),

    dateOfBirth: z
      .date({ error: 'Vui lòng chọn ngày sinh' })
      .min(new Date(1900, 0, 1), 'Năm sinh không hợp lệ')
      .max(
        new Date(currentYear - 15, 11, 31),
        'Bạn phải từ 15 tuổi trở lên để đăng ký',
      ),

    phone: z
      .string()
      .min(10, 'Số điện thoại phải có ít nhất 10 chữ số')
      .max(10, 'Số điện thoại không được vượt quá 10 chữ số')
      .regex(/^(03|05|07|08|09)\d{8}$/, 'Số điện thoại không đúng định dạng'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.email('Vui lòng nhập đúng định dạng email'),

  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export const updateAccountSchema = z.object({
  name: z
    .string()
    .min(2, 'Họ tên cần ít nhất 2 ký tự')
    .max(50, 'Họ tên tối đa 50 ký tự'),

  email: z.email('Email không hợp lệ'),

  dateOfBirth: z
    .date()
    .min(new Date(1900, 0, 1), 'Năm sinh không hợp lệ')
    .max(new Date(currentYear - 15, 11, 31), 'Bạn phải từ 15 tuổi trở lên'),

  phone: z
    .string()
    .min(10, 'Số điện thoại phải có ít nhất 10 chữ số')
    .max(10, 'Số điện thoại không được vượt quá 10 chữ số')
    .regex(/^(03|05|07|08|09)\d{8}$/, 'Số điện thoại không đúng định dạng'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type UpdateAccountFormData = z.infer<typeof updateAccountSchema>;
