import { candidateFormDetailsApi, candidateFormDetailsInternalApi } from '../configs/axios.config';
import { serverConfig } from '../configs/server.config';
import { SUBMISSION_LOOKUP_MAX_IDS } from '../constants/lookup';
import { SubmissionLookupEnvelope, SubmissionLookupItem } from '../types/AdminBooking.type';
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

/**
 * Candidate, lead score and a few answers (by question key) for each submission, from the form service.
 * Submissions the form service no longer has are missing from the result. Throws when the service cannot be reached.
 */
export async function lookupSubmissions(submissionIds: string[], answerKeys: string[]): Promise<SubmissionLookupItem[]> {
    if (!serverConfig.SCHEDULER_INTERNAL_API_KEY) {
        throw new Error('SCHEDULER_INTERNAL_API_KEY is not configured');
    }

    const submissions: SubmissionLookupItem[] = [];

    for (let index = 0; index < submissionIds.length; index += SUBMISSION_LOOKUP_MAX_IDS) {
        const chunk = submissionIds.slice(index, index + SUBMISSION_LOOKUP_MAX_IDS);
        const response = await candidateFormDetailsInternalApi.post<SubmissionLookupEnvelope>(
            '/internal/submissions/lookup',
            { submissionIds: chunk, answerKeys }
        );

        if (!response.data.success || !Array.isArray(response.data.data?.submissions)) {
            throw new Error('Form service lookup returned an unexpected response');
        }

        submissions.push(...response.data.data.submissions);
    }

    return submissions;
}
