const FIELDS = [
  { name: 'fullName', label: 'Full Name', autoComplete: 'name' },
  { name: 'phone', label: 'Phone Number', autoComplete: 'tel', inputMode: 'numeric', maxLength: 10 },
  { name: 'addressLine1', label: 'Address', autoComplete: 'address-line1' },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'state', label: 'State', autoComplete: 'address-level1' },
  { name: 'pincode', label: 'Pincode', autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6 }
];

export default function CheckoutForm({ values, errors, onChange, onSubmit, busy, busyLabel, disabled }) {
  return (
    <form className="card checkout-form" onSubmit={onSubmit} noValidate>
      <h3>Shipping Details</h3>

      {FIELDS.map((f) => (
        <div key={f.name} className="field">
          <label htmlFor={f.name}>{f.label}</label>
          <input
            id={f.name}
            name={f.name}
            type="text"
            className={`input ${errors[f.name] ? 'input-error' : ''}`}
            value={values[f.name]}
            onChange={onChange}
            autoComplete={f.autoComplete}
            inputMode={f.inputMode}
            maxLength={f.maxLength}
            disabled={busy}
            aria-invalid={Boolean(errors[f.name])}
          />
          {errors[f.name] && <small className="field-error">{errors[f.name]}</small>}
        </div>
      ))}

      <button type="submit" className="btn btn-primary btn-lg" disabled={busy || disabled}>
        {busy ? busyLabel : 'Place Order'}
      </button>
      <small className="muted center">Secure payment via Razorpay (Test Mode — no real money is charged).</small>
    </form>
  );
}
