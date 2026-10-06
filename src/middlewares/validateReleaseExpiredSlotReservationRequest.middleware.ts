// Same check as every other internal endpoint; kept under its old name so the release-expired-slots route is untouched.
export { validateInternalApiKey as validateReleaseExpiredSlotRequest } from './internalApiKey.middleware';
