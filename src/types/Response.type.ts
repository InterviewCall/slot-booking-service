import { AppError } from '../utils/errors/app.error';

export interface SuccessResponse<T> {
    success: boolean
    message: string
    data: T
    error: object
}

export type CreateBookingResponse = {
    candidateId: number,
    slotId: number,
    reservationId: string
    expiredAt: string
}

export type CandidateData = {
    id: number,
    fullName: string,
    email: string,
    phone: string
}

export type Submissiondata = {
    submissionId: string,
    candidateId: number
}

export type CandidateDetailsResponse = {
    success: boolean,
    message: string,
    data: CandidateData,
    error: Record<string, unknown>
}

export type FormSubmissionDetailsResponse = {
    success: boolean,
    message: string,
    data: Submissiondata,
    error: Record<string, unknown>
}

export type ApiErrorResponse = {
    success: boolean;
    message: string;
    data: unknown;
    error: AppError;
};

export type ReservationStatus =
  | 'pending_confirmation'
  | 'confirmed';

export type ReservationReviewResponse = {
    candidateName: string;
    candidateEmail: string;
    candidatePhone: string;
    slotDetails: string;
    expiresAt: Date;
    reservationStatus: ReservationStatus;
};

export type UpdateCountResponse = {
    totalReleasedCount: number,
    updatedBookingCount: number,
    updatedDateTimeSlotCount: number
}