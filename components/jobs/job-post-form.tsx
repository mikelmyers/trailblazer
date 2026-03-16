'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type PackageSize = 'ENVELOPE' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'PALLET';
type Urgency = 'STANDARD' | 'EXPRESS' | 'CRITICAL';

interface JobPostFormData {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  packageSize: PackageSize;
  description: string;
  urgency: Urgency;
  specialInstructions: string;
  priceCents: number;
}

interface JobPostFormProps {
  onSubmit: (data: JobPostFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS: Record<Step, string> = {
  1: 'Pickup',
  2: 'Dropoff',
  3: 'Package',
  4: 'Urgency',
  5: 'Pricing',
  6: 'Review',
};

const PACKAGE_OPTIONS: { value: PackageSize; label: string; description: string }[] = [
  { value: 'ENVELOPE', label: 'Envelope', description: 'Documents, letters, small flat items' },
  { value: 'SMALL', label: 'Small', description: 'Fits in a shoebox or smaller' },
  { value: 'MEDIUM', label: 'Medium', description: 'Fits in a standard moving box' },
  { value: 'LARGE', label: 'Large', description: 'Furniture, appliances, oversized items' },
  { value: 'PALLET', label: 'Pallet', description: 'Industrial freight, bulk shipment' },
];

const URGENCY_OPTIONS: { value: Urgency; label: string; description: string; color: string }[] = [
  { value: 'STANDARD', label: 'Standard', description: 'Delivery within 24 hours', color: 'border-border' },
  { value: 'EXPRESS', label: 'Express', description: 'Delivery within 4 hours', color: 'border-yellow-400' },
  { value: 'CRITICAL', label: 'Critical', description: 'Delivery within 1 hour', color: 'border-red-400' },
];

interface PriceEstimate {
  suggestedPriceCents: number;
  suggestedPriceFormatted: string;
  priceRange: {
    minCents: number;
    maxCents: number;
    minFormatted: string;
    maxFormatted: string;
  };
  breakdown: {
    baseCost: string;
    package: string;
    urgency: string;
    time: string;
    routeComplexity: string;
    region: string;
  };
  route: {
    distanceKm: number;
    durationMin: number;
  };
}

interface StepErrors {
  [field: string]: string;
}

function validateStep(step: Step, data: JobPostFormData): StepErrors {
  const errors: StepErrors = {};

  switch (step) {
    case 1:
      if (!data.pickupAddress.trim() || data.pickupAddress.trim().length < 5) {
        errors.pickupAddress = 'Pickup address must be at least 5 characters';
      }
      if (data.pickupLat === 0 && data.pickupLng === 0) {
        errors.pickupCoords = 'Pickup coordinates are required';
      }
      break;
    case 2:
      if (!data.dropoffAddress.trim() || data.dropoffAddress.trim().length < 5) {
        errors.dropoffAddress = 'Dropoff address must be at least 5 characters';
      }
      if (data.dropoffLat === 0 && data.dropoffLng === 0) {
        errors.dropoffCoords = 'Dropoff coordinates are required';
      }
      break;
    case 3:
      if (!data.packageSize) {
        errors.packageSize = 'Please select a package size';
      }
      break;
    case 4:
      if (!data.urgency) {
        errors.urgency = 'Please select an urgency level';
      }
      break;
    case 5:
      if (!data.priceCents || data.priceCents < 500) {
        errors.priceCents = 'Price must be at least $5.00';
      }
      break;
    default:
      break;
  }

  return errors;
}

const JobPostForm: React.FC<JobPostFormProps> = ({
  onSubmit,
  isSubmitting = false,
  className = '',
}) => {
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [formData, setFormData] = useState<JobPostFormData>({
    pickupAddress: '',
    pickupLat: 0,
    pickupLng: 0,
    dropoffAddress: '',
    dropoffLat: 0,
    dropoffLng: 0,
    packageSize: 'SMALL',
    description: '',
    urgency: 'STANDARD',
    specialInstructions: '',
    priceCents: 0,
  });

  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [priceInput, setPriceInput] = useState('');

  const updateField = useCallback(
    <K extends keyof JobPostFormData>(field: K, value: JobPostFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  // Fetch price estimate when entering step 5
  useEffect(() => {
    if (step !== 5) return;
    if (priceEstimate) return;

    async function fetchEstimate() {
      setEstimateLoading(true);
      try {
        const res = await fetch('/api/jobs/price-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pickupLat: formData.pickupLat,
            pickupLng: formData.pickupLng,
            dropoffLat: formData.dropoffLat,
            dropoffLng: formData.dropoffLng,
            packageSize: formData.packageSize,
            urgency: formData.urgency,
          }),
        });

        if (res.ok) {
          const data: PriceEstimate = await res.json();
          setPriceEstimate(data);
          const suggestedDollars = (data.suggestedPriceCents / 100).toFixed(2);
          setPriceInput(suggestedDollars);
          updateField('priceCents', data.suggestedPriceCents);
        }
      } catch {
        // Estimate failed — user can still enter price manually
      } finally {
        setEstimateLoading(false);
      }
    }

    fetchEstimate();
  }, [step, priceEstimate, formData.pickupLat, formData.pickupLng, formData.dropoffLat, formData.dropoffLng, formData.packageSize, formData.urgency, updateField]);

  const handlePriceChange = useCallback(
    (value: string) => {
      setPriceInput(value);
      const dollars = parseFloat(value);
      if (!isNaN(dollars) && dollars > 0) {
        updateField('priceCents', Math.round(dollars * 100));
      } else {
        updateField('priceCents', 0);
      }
    },
    [updateField],
  );

  const handleNext = useCallback(() => {
    const stepErrors = validateStep(step, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, 6) as Step);
  }, [step, formData]);

  const handleBack = useCallback(() => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1) as Step);
  }, []);

  const handleSubmit = useCallback(async () => {
    await onSubmit(formData);
  }, [formData, onSubmit]);

  const isPriceBelowRange =
    priceEstimate && formData.priceCents > 0 && formData.priceCents < priceEstimate.priceRange.minCents;
  const isPriceAboveRange =
    priceEstimate && formData.priceCents > priceEstimate.priceRange.maxCents;

  return (
    <div className={`w-full max-w-xl ${className}`}>
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {([1, 2, 3, 4, 5, 6] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  s < step
                    ? 'bg-accent text-white'
                    : s === step
                      ? 'bg-accent text-white ring-2 ring-accent/20'
                      : 'bg-background-3 text-text-muted'
                }`}
              >
                {s < step ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.5 3.5L5.5 10.5L2.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium ${
                  s <= step ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < 5 && (
              <div
                className={`flex-1 h-px mx-2 mt-[-12px] ${
                  s < step ? 'bg-accent' : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Pickup */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-h3 text-text-primary">Pickup Location</h3>
          <div>
            <Input
              label="Pickup Address"
              placeholder="Enter pickup address"
              value={formData.pickupAddress}
              onChange={(e) => updateField('pickupAddress', e.target.value)}
            />
            {errors.pickupAddress && (
              <p className="text-xs text-danger mt-1">{errors.pickupAddress}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Latitude"
                type="number"
                step="any"
                placeholder="40.7128"
                value={formData.pickupLat || ''}
                onChange={(e) =>
                  updateField('pickupLat', parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Input
                label="Longitude"
                type="number"
                step="any"
                placeholder="-74.0060"
                value={formData.pickupLng || ''}
                onChange={(e) =>
                  updateField('pickupLng', parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
          {errors.pickupCoords && (
            <p className="text-xs text-danger">{errors.pickupCoords}</p>
          )}
          <p className="text-xs text-text-muted">
            Enter the address and coordinates for the location.
          </p>
        </div>
      )}

      {/* Step 2: Dropoff */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-h3 text-text-primary">Dropoff Location</h3>
          <div>
            <Input
              label="Dropoff Address"
              placeholder="Enter dropoff address"
              value={formData.dropoffAddress}
              onChange={(e) => updateField('dropoffAddress', e.target.value)}
            />
            {errors.dropoffAddress && (
              <p className="text-xs text-danger mt-1">{errors.dropoffAddress}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Latitude"
                type="number"
                step="any"
                placeholder="40.7580"
                value={formData.dropoffLat || ''}
                onChange={(e) =>
                  updateField('dropoffLat', parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Input
                label="Longitude"
                type="number"
                step="any"
                placeholder="-73.9855"
                value={formData.dropoffLng || ''}
                onChange={(e) =>
                  updateField('dropoffLng', parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
          {errors.dropoffCoords && (
            <p className="text-xs text-danger">{errors.dropoffCoords}</p>
          )}
          <p className="text-xs text-text-muted">
            Enter the address and coordinates for the location.
          </p>
        </div>
      )}

      {/* Step 3: Package */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-h3 text-text-primary">Package Details</h3>
          {errors.packageSize && (
            <p className="text-xs text-danger">{errors.packageSize}</p>
          )}
          <div className="grid gap-2">
            {PACKAGE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  formData.packageSize === opt.value
                    ? 'border-accent bg-background-3'
                    : 'border-border hover:border-border-strong'
                }`}
              >
                <input
                  type="radio"
                  name="packageSize"
                  value={opt.value}
                  checked={formData.packageSize === opt.value}
                  onChange={() => updateField('packageSize', opt.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    formData.packageSize === opt.value
                      ? 'border-accent'
                      : 'border-border-strong'
                  }`}
                >
                  {formData.packageSize === opt.value && (
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    {opt.label}
                  </span>
                  <p className="text-xs text-text-muted">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Description (optional)
            </label>
            <textarea
              className="w-full px-3 py-2 bg-background-3 border border-border rounded-md text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition resize-none"
              rows={3}
              placeholder="Describe the package contents"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step 4: Urgency */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-h3 text-text-primary">Urgency Level</h3>
          {errors.urgency && (
            <p className="text-xs text-danger">{errors.urgency}</p>
          )}
          <div className="grid gap-2">
            {URGENCY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  formData.urgency === opt.value
                    ? opt.color + ' bg-background-3'
                    : 'border-border hover:border-border-strong'
                }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={opt.value}
                  checked={formData.urgency === opt.value}
                  onChange={() => updateField('urgency', opt.value)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    formData.urgency === opt.value
                      ? 'border-accent'
                      : 'border-border-strong'
                  }`}
                >
                  {formData.urgency === opt.value && (
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    {opt.label}
                  </span>
                  <p className="text-xs text-text-muted">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Special Instructions (optional)
            </label>
            <textarea
              className="w-full px-3 py-2 bg-background-3 border border-border rounded-md text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition resize-none"
              rows={3}
              placeholder="Any special handling or delivery instructions"
              value={formData.specialInstructions}
              onChange={(e) => updateField('specialInstructions', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step 5: Pricing */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-h3 text-text-primary">Set Your Price</h3>
          <p className="text-sm text-text-secondary">
            Set how much you will pay for this delivery. Our pricing engine suggests a price based on distance, package, urgency, time of day, and region.
          </p>

          {estimateLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
              <span className="ml-3 text-sm text-text-secondary">Calculating suggested price...</span>
            </div>
          ) : (
            <>
              {/* Suggested price */}
              {priceEstimate && (
                <div className="bg-background-3 rounded-lg p-5 border border-border">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-sm font-medium text-text-primary">Suggested Price</span>
                    <span className="font-mono text-h2 font-bold text-text-primary">
                      {priceEstimate.suggestedPriceFormatted}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-text-secondary">
                    <div className="flex justify-between">
                      <span>Base cost</span>
                      <span className="font-mono">{priceEstimate.breakdown.baseCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Package</span>
                      <span className="font-mono">{priceEstimate.breakdown.package}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Urgency</span>
                      <span className="font-mono">{priceEstimate.breakdown.urgency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time of day</span>
                      <span className="font-mono">{priceEstimate.breakdown.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Route complexity</span>
                      <span className="font-mono">{priceEstimate.breakdown.routeComplexity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Region</span>
                      <span className="font-mono">{priceEstimate.breakdown.region}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-text-muted">
                    <span>Route: {priceEstimate.route.distanceKm} km</span>
                    <span className="text-border">|</span>
                    <span>ETA: {priceEstimate.route.durationMin} min</span>
                  </div>
                </div>
              )}

              {/* Price input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Your Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono">$</span>
                  <input
                    type="number"
                    step="0.50"
                    min="5.00"
                    className="w-full pl-7 pr-3 py-2 bg-background-3 border border-border rounded-md text-sm font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                    placeholder="0.00"
                    value={priceInput}
                    onChange={(e) => handlePriceChange(e.target.value)}
                  />
                </div>
                {errors.priceCents && (
                  <p className="text-xs text-danger mt-1">{errors.priceCents}</p>
                )}
              </div>

              {/* Price range warning */}
              {isPriceBelowRange && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 mt-0.5 shrink-0">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="text-xs text-yellow-800">
                    This price is below the typical range ({priceEstimate?.priceRange.minFormatted} – {priceEstimate?.priceRange.maxFormatted}). Drivers may be less likely to accept this job.
                  </p>
                </div>
              )}
              {isPriceAboveRange && (
                <p className="text-xs text-text-muted">
                  This price is above the typical range. Drivers will love this job.
                </p>
              )}

              {priceEstimate && !isPriceBelowRange && !isPriceAboveRange && (
                <p className="text-xs text-text-muted">
                  Drivers typically accept {priceEstimate.priceRange.minFormatted} – {priceEstimate.priceRange.maxFormatted} for this route.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 6: Review */}
      {step === 6 && (
        <div className="space-y-4">
          <h3 className="text-h3 text-text-primary">Review Your Job</h3>

          <div className="space-y-3">
            <div className="bg-background-3 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-label uppercase text-text-muted">Pickup</span>
                <p className="text-sm text-text-primary mt-0.5">{formData.pickupAddress}</p>
                <p className="text-xs text-text-muted font-mono">
                  {formData.pickupLat.toFixed(6)}, {formData.pickupLng.toFixed(6)}
                </p>
              </div>
              <div className="border-t border-border pt-3">
                <span className="text-label uppercase text-text-muted">Dropoff</span>
                <p className="text-sm text-text-primary mt-0.5">{formData.dropoffAddress}</p>
                <p className="text-xs text-text-muted font-mono">
                  {formData.dropoffLat.toFixed(6)}, {formData.dropoffLng.toFixed(6)}
                </p>
              </div>
              <div className="border-t border-border pt-3 grid grid-cols-3 gap-3">
                <div>
                  <span className="text-label uppercase text-text-muted">Package</span>
                  <p className="text-sm text-text-primary mt-0.5">
                    {PACKAGE_OPTIONS.find((p) => p.value === formData.packageSize)?.label}
                  </p>
                </div>
                <div>
                  <span className="text-label uppercase text-text-muted">Urgency</span>
                  <p className="text-sm text-text-primary mt-0.5">
                    {URGENCY_OPTIONS.find((u) => u.value === formData.urgency)?.label}
                  </p>
                </div>
                <div>
                  <span className="text-label uppercase text-text-muted">Price</span>
                  <p className="text-sm text-text-primary mt-0.5 font-mono font-semibold">
                    ${(formData.priceCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              {formData.description && (
                <div className="border-t border-border pt-3">
                  <span className="text-label uppercase text-text-muted">Description</span>
                  <p className="text-sm text-text-primary mt-0.5">{formData.description}</p>
                </div>
              )}
              {formData.specialInstructions && (
                <div className="border-t border-border pt-3">
                  <span className="text-label uppercase text-text-muted">Special Instructions</span>
                  <p className="text-sm text-text-primary mt-0.5">{formData.specialInstructions}</p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-text-muted text-center">
              Route optimized by Terra
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {step > 1 ? (
          <Button variant="secondary" size="sm" onClick={handleBack} type="button">
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < 6 ? (
          <Button variant="primary" size="sm" onClick={handleNext} type="button">
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            type="button"
          >
            {isSubmitting ? 'Submitting\u2026' : 'Submit Job'}
          </Button>
        )}
      </div>
    </div>
  );
};

JobPostForm.displayName = 'JobPostForm';

export { JobPostForm };
export type { JobPostFormProps, JobPostFormData };
