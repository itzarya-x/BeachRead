export type SupportedOtpType = 'signup' | 'email' | 'recovery' | 'invite' | 'email_change';

export type AuthLinkPayload =
  | { kind: 'code'; code: string }
  | { kind: 'otp'; tokenHash: string; type: SupportedOtpType }
  | { kind: 'none' };

const SUPPORTED_OTP_TYPES: SupportedOtpType[] = ['signup', 'email', 'recovery', 'invite', 'email_change'];

export function extractAuthLinkPayload(
  searchParams: URLSearchParams,
  allowedTypes?: readonly SupportedOtpType[],
): AuthLinkPayload {
  const code = searchParams.get('code');
  if (code) {
    return { kind: 'code', code };
  }

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const validTypes = allowedTypes ?? SUPPORTED_OTP_TYPES;

  if (tokenHash && type && validTypes.includes(type as SupportedOtpType)) {
    return {
      kind: 'otp',
      tokenHash,
      type: type as SupportedOtpType,
    };
  }

  return { kind: 'none' };
}
