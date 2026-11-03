export const PLATE_REGEX = /^KL\d{2}[A-Z]{1,3}\d{4}$/;

export const normalizePlate = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export const isValidPlate = (value) => PLATE_REGEX.test(normalizePlate(value));

export const PLATE_FORMAT_MSG = 'Invalid plate format. Use KL07AB1234 or KL05Z1234 (KL + 2 digits + 1 to 3 letters + 4 digits)';

export const PLATE_HINT = 'Format: KL + 2 digits + 1 to 3 letters + 4 digits (e.g. KL07AB1234, KL05Z1234)';
