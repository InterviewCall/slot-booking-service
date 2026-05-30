export function getReservationExpireTimeStamp(): Date {
    return new Date(Date.now() - 1000 * 60);
}

export function getOneReservationExpireTimeStamp(createdAt: Date): number {
    return new Date(createdAt.getTime() + 1000 * 60).getTime();
}