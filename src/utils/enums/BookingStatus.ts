export enum BookingStatus {
    CONFIRMED = 'confirmed',
    INITIATED = 'initiated',
    CANCELLED = 'cancelled',
    // The admin marked the counselling call as done. Only a confirmed booking can get here (and go back).
    COMPLETED = 'completed'
}