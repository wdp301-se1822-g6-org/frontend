import axios from 'axios';
import { ApiErrorResponse } from '@/types/error';

/**
 * Chuyển một lỗi bất kỳ (axios/Error/unknown) thành thông điệp thân thiện
 * tiếng Việt để hiển thị cho người dùng. Dùng chung toàn app.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.';
    }

    const serverMessage = error.response.data?.message;

    if (serverMessage && isUserFriendlyMessage(serverMessage)) {
      return serverMessage;
    }

    switch (error.response.status) {
      case 400:
        return 'Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.';
      case 401:
        return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này.';
      case 404:
        return 'Không tìm thấy dữ liệu cần xử lý.';
      case 409:
        return 'Dữ liệu đã tồn tại hoặc đang bị trùng. Vui lòng kiểm tra lại.';
      case 422:
        return 'Một vài trường thông tin chưa đúng. Vui lòng kiểm tra lại.';
      default:
        return 'Có lỗi xảy ra từ hệ thống. Vui lòng thử lại sau.';
    }
  }

  if (error instanceof Error) {
    return isUserFriendlyMessage(error.message)
      ? error.message
      : 'Có lỗi xảy ra. Vui lòng thử lại.';
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

function isUserFriendlyMessage(message: string): boolean {
  if (message.length > 140) return false;
  return !/(exception|stack|sql|jwt|token|undefined|null|\{|\}|<|>)/i.test(
    message,
  );
}
