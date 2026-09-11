import { candidateFormDetailsApi } from '../configs/axios.config';
import { CandidateDetailsResponse, FormSubmissionDetailsResponse } from '../types/Response.type';

export async function fetchCandidateDetails(candidateId: string): Promise<CandidateDetailsResponse> {
    const response = await candidateFormDetailsApi.get<CandidateDetailsResponse>(`/candidates/${candidateId}`);
    return response.data;
}

export async function fetchFormSubmissionDetails(
    submissionId: string
): Promise<FormSubmissionDetailsResponse> {
    const response =
        await candidateFormDetailsApi.get<FormSubmissionDetailsResponse>(
            `/submissions/${encodeURIComponent(submissionId)}`
        );

    return response.data;
}
export async function markSubmissionAsBooked(submissionId: string): Promise<void> {
    await candidateFormDetailsApi.put(
        `/submissions/${encodeURIComponent(submissionId)}/book`
    );
}