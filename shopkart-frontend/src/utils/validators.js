// Client-side shipping validation. Same rules as the server (utils/validateShipping.js),
// so basic mistakes never trigger a network call.
export const EMPTY_SHIPPING = {
  fullName: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: ''
};

export const validateShipping = (values) => {
  const errors = {};
  const v = (key) => (values[key] || '').trim();

  if (!v('fullName')) errors.fullName = 'Full Name is required.';
  if (!v('phone')) errors.phone = 'Phone Number is required.';
  else if (!/^\d{10}$/.test(v('phone'))) errors.phone = 'Phone number must contain exactly 10 digits.';
  if (!v('addressLine1')) errors.addressLine1 = 'Address is required.';
  if (!v('city')) errors.city = 'City is required.';
  if (!v('state')) errors.state = 'State is required.';
  if (!v('pincode')) errors.pincode = 'Pincode is required.';
  else if (!/^\d{6}$/.test(v('pincode'))) errors.pincode = 'Pincode must contain exactly 6 digits.';

  return errors;
};

export const trimShipping = (values) =>
  Object.fromEntries(Object.entries(values).map(([k, val]) => [k, String(val).trim()]));
