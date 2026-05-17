import IdempotencyKey from '../db/models/IdempotencyKey.model';
import BaseRepository from './Base.repository';

class IdempotencyKeyRepository extends BaseRepository<IdempotencyKey> {
    constructor() {
        super(IdempotencyKey);
    }
}

export default IdempotencyKeyRepository;