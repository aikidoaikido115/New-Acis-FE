interface ErrorMessage {
  title: string;
  message: string;
}

/**
 * Error object structure from API client
 */
interface ApiError {
  message?: string;
  status_code?: number;
  status?: string;
}

/**
 * Maps backend error messages to UX-friendly Thai messages
 * For security reasons, authentication errors are intentionally vague
 */
export function getAuthErrorMessage(error: unknown): ErrorMessage {
  // Type guard to safely access error properties
  const apiError = error as ApiError;
  const errorMessage = apiError?.message?.toLowerCase() || '';
  const statusCode = apiError?.status_code || 0;

  // Network errors
  if (statusCode === 0 || errorMessage.includes('network')) {
    return {
      title: 'ไม่สามารถเชื่อมต่อได้',
      message: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณและลองอีกครั้ง',
    };
  }

  // Timeout errors
  if (errorMessage.includes('timeout')) {
    return {
      title: 'หมดเวลาการเชื่อมต่อ',
      message: 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองอีกครั้ง',
    };
  }

  // Authentication errors - Check message content BEFORE status code
  // Backend returns 500 for auth errors, so we need to check the message first
  // Security best practice: Don't reveal whether username or password is wrong
  if (
    errorMessage.includes('invalid username') ||
    errorMessage.includes('invalid email') ||
    errorMessage.includes('invalid password') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('incorrect') ||
    errorMessage.includes('wrong') ||
    errorMessage.includes('credential') ||
    errorMessage.includes('user not found')
  ) {
    return {
      title: 'ข้อมูลไม่ถูกต้อง',
      message: 'ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง',
    };
  }

  // Account locked/suspended
  if (
    errorMessage.includes('locked') ||
    errorMessage.includes('suspended') ||
    errorMessage.includes('disabled') ||
    errorMessage.includes('blocked')
  ) {
    return {
      title: 'บัญชีถูกระงับ',
      message: 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
    };
  }

  // Too many attempts
  if (
    errorMessage.includes('too many') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('attempts')
  ) {
    return {
      title: 'พยายามเข้าสู่ระบบหลายครั้ง',
      message: 'คุณพยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง',
    };
  }

  // Validation errors (400)
  if (statusCode === 400) {
    if (errorMessage.includes('email')) {
      return {
        title: 'รูปแบบอีเมลไม่ถูกต้อง',
        message: 'กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง เช่น example@email.com',
      };
    }
    if (errorMessage.includes('required') || errorMessage.includes('empty') || errorMessage.includes('missing')) {
      return {
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
      };
    }
  }

  // Authentication status codes (401, 403) - after message check
  if (statusCode === 401 || statusCode === 403) {
    return {
      title: 'ข้อมูลไม่ถูกต้อง',
      message: 'ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง',
    };
  }

  // Server errors (500+) - MUST be checked AFTER auth error messages
  if (statusCode >= 500) {
    // Check if it's a database or system error (not auth related)
    if (
      errorMessage.includes('database') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('server')
    ) {
      return {
        title: 'เกิดข้อผิดพลาดของระบบ',
        message: 'ระบบมีปัญหาชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง',
      };
    }
    // If it's a 500 error but not clearly a system issue, show generic error
    return {
      title: 'เข้าสู่ระบบไม่สำเร็จ',
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองอีกครั้ง',
    };
  }

  // Default error message
  return {
    title: 'เข้าสู่ระบบไม่สำเร็จ',
    message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองอีกครั้ง',
  };
}

/**
 * Validation errors for form inputs
 */
export const validationMessages = {
  required: 'กรุณากรอกข้อมูลนี้',
  emailFormat: 'กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง',
  passwordTooShort: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร',
  passwordMismatch: 'รหัสผ่านไม่ตรงกัน',
  usernameTooShort: 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร',
  invalidCharacters: 'มีตัวอักษรที่ไม่ถูกต้อง',
} as const;

/**
 * Success messages
 */
export const successMessages = {
  loginSuccess: 'เข้าสู่ระบบสำเร็จ',
  registerSuccess: 'สมัครสมาชิกสำเร็จ',
  otpSent: 'ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว',
  passwordChanged: 'เปลี่ยนรหัสผ่านสำเร็จ',
} as const;
