'use client';

// The export is the browser's own "Save as PDF"; this only opens the dialog.
export function PrintButton() {
  return (
    <button type="button" className="btn btn-sm btn-primary" onClick={() => window.print()}>
      Print / Save as PDF
    </button>
  );
}
