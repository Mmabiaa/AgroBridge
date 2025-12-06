/**
 * ScanFeedback Component
 * Task 8.5: Feedback mechanism for scan results
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { useScanFeedback } from '@/api/hooks/useCropDetection';
import { toast } from 'sonner';

interface ScanFeedbackProps {
  scanId: string;
  detectedDiseases?: Array<{ disease_id?: string; disease_name: string }>;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ScanFeedback({
  scanId,
  detectedDiseases = [],
  open,
  onClose,
  onSuccess,
}: ScanFeedbackProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [confirmedDisease, setConfirmedDisease] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [treatmentApplied, setTreatmentApplied] = useState<string>('');

  const scanFeedbackMutation = useScanFeedback();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    try {
      await scanFeedbackMutation.mutateAsync({
        scanId,
        feedback: {
          accuracy_rating: rating,
          user_confirmed_disease: confirmedDisease || undefined,
          user_feedback: feedback || undefined,
          treatment_applied: treatmentApplied ? [{ treatment: treatmentApplied }] : undefined,
        },
      });

      toast.success('Feedback submitted', {
        description: 'Thank you for helping us improve our detection accuracy',
      });

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error('Feedback submission failed:', error);
      toast.error('Failed to submit feedback', {
        description: error?.message || 'Please try again later',
      });
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setConfirmedDisease('');
    setFeedback('');
    setTreatmentApplied('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Provide Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve our disease detection accuracy by providing feedback on this scan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>How accurate was the detection?</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating === 1 && 'Very Inaccurate'}
                  {rating === 2 && 'Inaccurate'}
                  {rating === 3 && 'Acceptable'}
                  {rating === 4 && 'Accurate'}
                  {rating === 5 && 'Very Accurate'}
                </span>
              )}
            </div>
          </div>

          {/* Confirmed Disease */}
          {detectedDiseases.length > 0 && (
            <div className="space-y-2">
              <Label>Confirm the actual disease (optional)</Label>
              <Select value={confirmedDisease} onValueChange={setConfirmedDisease}>
                <SelectTrigger>
                  <SelectValue placeholder="Select disease if different" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not sure / Same as detected</SelectItem>
                  {detectedDiseases.map((disease, idx) => (
                    <SelectItem key={idx} value={disease.disease_id || disease.disease_name}>
                      {disease.disease_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Treatment Applied */}
          <div className="space-y-2">
            <Label>Treatment applied (optional)</Label>
            <Input
              placeholder="e.g., Neem oil spray, Fungicide application"
              value={treatmentApplied}
              onChange={(e) => setTreatmentApplied(e.target.value)}
            />
          </div>

          {/* Additional Feedback */}
          <div className="space-y-2">
            <Label>Additional comments (optional)</Label>
            <Textarea
              placeholder="Share any observations or suggestions..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={scanFeedbackMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={scanFeedbackMutation.isPending || rating === 0}>
            {scanFeedbackMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Input component (if not already defined)
function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
