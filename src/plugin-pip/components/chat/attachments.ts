export const CHAT_ATTACHMENT_MAX_FILE_SIZE = 25 * 1024 * 1024;
export const CHAT_ATTACHMENT_MAX_FILES = 5;

const MARKER_PREFIX = '[[bbb-chat-attachment:v1:';
const MARKER_SUFFIX = ']]';
const FILE_ID_PATTERN = /^[a-f0-9-]{36}$/;

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  previewableImage: boolean;
}

export interface ParsedChatAttachments {
  attachments: ChatAttachment[];
  markerLines: string[];
}

const encodeBase64Url = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const decodeBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = window.atob(base64 + padding);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const isChatAttachment = (value: unknown): value is ChatAttachment => {
  if (value == null || typeof value !== 'object') return false;
  const attachment = value as Partial<ChatAttachment>;
  return typeof attachment.id === 'string'
    && FILE_ID_PATTERN.test(attachment.id)
    && typeof attachment.name === 'string'
    && attachment.name.length > 0
    && attachment.name.length <= 255
    && typeof attachment.size === 'number'
    && Number.isSafeInteger(attachment.size)
    && attachment.size > 0
    && attachment.size <= CHAT_ATTACHMENT_MAX_FILE_SIZE
    && typeof attachment.mimeType === 'string'
    && typeof attachment.previewableImage === 'boolean';
};

export const serializeChatAttachment = (attachment: ChatAttachment) => (
  `${MARKER_PREFIX}${encodeBase64Url(JSON.stringify(attachment))}${MARKER_SUFFIX}`
);

export const parseChatAttachments = (
  message: string | null | undefined,
): ParsedChatAttachments => {
  const attachments: ChatAttachment[] = [];
  const markerLines: string[] = [];
  const safeMessage = typeof message === 'string' ? message : '';

  safeMessage.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith(MARKER_PREFIX) || !trimmedLine.endsWith(MARKER_SUFFIX)) return;

    const payload = trimmedLine.slice(MARKER_PREFIX.length, -MARKER_SUFFIX.length);
    try {
      const parsed = JSON.parse(decodeBase64Url(payload));
      if (isChatAttachment(parsed)) {
        attachments.push(parsed);
        markerLines.push(trimmedLine);
      }
    } catch {
      // Invalid markers are displayed as regular text and never become URLs.
    }
  });

  return { attachments, markerLines };
};

export const removeAttachmentMarkersFromHtml = (
  html: string | null | undefined,
  markerLines: string[],
) => {
  let result = typeof html === 'string' ? html : '';
  markerLines.forEach((marker) => {
    result = result.split(marker).join('');
  });
  return result
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/(?:<br\s*\/?>(?:\s*)){2,}$/gi, '')
    .trim();
};

export const uploadChatAttachment = async (
  file: File,
  sessionToken: string,
): Promise<ChatAttachment> => {
  if (!sessionToken) throw new Error('missing-session-token');

  const formData = new FormData();
  formData.append('file', file, file.name);
  const uploadUrl = new URL('/bigbluebutton/chat-attachment/upload', window.location.origin);
  uploadUrl.searchParams.set('sessionToken', sessionToken);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'upload-failed');
  }

  const attachment = await response.json();
  if (!isChatAttachment(attachment)) throw new Error('invalid-upload-response');
  return attachment;
};

export const chatAttachmentUrl = (
  attachment: ChatAttachment,
  meetingId: string,
  sessionToken: string,
  preview = false,
) => {
  const path = [
    '/bigbluebutton/chat-attachment',
    encodeURIComponent(meetingId),
    encodeURIComponent(attachment.id),
  ].join('/');
  const url = new URL(path, window.location.origin);
  url.searchParams.set('sessionToken', sessionToken);
  if (preview) url.searchParams.set('preview', 'true');
  return url.href;
};

export const formatAttachmentSize = (size: number, locale: string) => {
  if (size < 1024) return `${size} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = size / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${unit}`;
};
