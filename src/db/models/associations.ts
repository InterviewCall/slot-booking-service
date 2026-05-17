import Booking from './Booking.model';
import BookingDate from './BookingDate.model';
import BookingTimeSlot from './BookingTimeSlot.model';
import DateTimeSlot from './DateTimeSlot.model';
import IdempotencyKey from './IdempotencyKey.model';

export function setupAssociations() {
    /**
     * BookingDate → DateTimeSlot
     *
     * One booking date has many date-time slots.
     */
    BookingDate.hasMany(DateTimeSlot, {
        foreignKey: 'bookingDateId',
        as: 'dateTimeSlots',
    });

    DateTimeSlot.belongsTo(BookingDate, {
        foreignKey: 'bookingDateId',
        as: 'bookingDate',
    });

    /**
     * BookingTimeSlot → DateTimeSlot
     *
     * One time slot appears in many date-time slots.
     */
    BookingTimeSlot.hasMany(DateTimeSlot, {
        foreignKey: 'bookingTimeSlotId',
        as: 'dateTimeSlots',
    });

    DateTimeSlot.belongsTo(BookingTimeSlot, {
        foreignKey: 'bookingTimeSlotId',
        as: 'timeSlot',
    });

    /**
     * BookingDate ↔ BookingTimeSlot
     *
     * Many-to-many through DateTimeSlot.
     */
    BookingDate.belongsToMany(BookingTimeSlot, {
        through: DateTimeSlot,
        foreignKey: 'bookingDateId',
        otherKey: 'bookingTimeSlotId',
        as: 'timeSlots',
    });

    BookingTimeSlot.belongsToMany(BookingDate, {
        through: DateTimeSlot,
        foreignKey: 'bookingTimeSlotId',
        otherKey: 'bookingDateId',
        as: 'bookingDates',
    });

    /**
     * DateTimeSlot → Booking
     *
     * One slot can have booking history.
     */
    DateTimeSlot.hasMany(Booking, {
        foreignKey: 'dateTimeSlotId',
        as: 'bookings',
    });

    Booking.belongsTo(DateTimeSlot, {
        foreignKey: 'dateTimeSlotId',
        as: 'dateTimeSlot',
    });

    /**
     * Booking → IdempotencyKey
     */
    Booking.hasOne(IdempotencyKey, {
        foreignKey: 'bookingId',
        as: 'idempotencyKey',
    });

    IdempotencyKey.belongsTo(Booking, {
        foreignKey: 'bookingId',
        as: 'booking',
    });
}