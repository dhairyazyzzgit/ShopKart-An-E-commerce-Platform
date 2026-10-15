// Shared server-side validation for the shipping address.
// Mirrors the client-side rules in the frontend (utils/validators.js).

const FIELDS = [
  ['fullName', 'Full Name'],
  ['phone', 'Phone Number'],
  ['addressLine1', 'Address'],
  ['city', 'City'],
  ['state', 'State'],
  ['pincode', 'Pincode']
];

export const validateShippingAddress = (input) => {
  const errors = {};
  const clean = {};

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: { form: 'Shipping address is required.' }, clean };
  }

  for (const [key, label] of FIELDS) {
    const raw = input[key];
    const value = typeof raw === 'string' ? raw.trim() : '';
    clean[key] = value;
    if (!value) errors[key] = `${label} is required.`;
  }

  if (!errors.phone && !/^\d{10}$/.test(clean.phone)) {
    errors.phone = 'Phone number must contain exactly 10 digits.';
  }
  if (!errors.pincode && !/^\d{6}$/.test(clean.pincode)) {
    errors.pincode = 'Pincode must contain exactly 6 digits.';
  }

  return { valid: Object.keys(errors).length === 0, errors, clean };
};
