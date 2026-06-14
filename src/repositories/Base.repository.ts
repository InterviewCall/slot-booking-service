import { CreationAttributes, InferAttributes, Model, ModelStatic, WhereOptions } from 'sequelize';

import { NotFoundError } from '../utils/errors/app.error';

abstract class BaseRepository<M extends Model> {
    protected model: ModelStatic<M>;

    constructor(model: ModelStatic<M>) {
        this.model = model;
    }

    async create(data: CreationAttributes<M>): Promise<M> {
        const record = await this.model.create(data);
        return record;
    }

    async findAll(): Promise<M[]> {
        const record = await this.model.findAll();
        return record;
    }

    async findById(id: number | string | bigint): Promise<M | null> {
        const record = await this.model.findByPk(id);
        return record;
    }

    async findOne(whereOptions: WhereOptions<InferAttributes<M>>): Promise<M | null> {
        const record = await this.model.findOne({
            where: whereOptions
        });

        return record;
    }

    async updateById(id: number | string | bigint, data: Partial<InferAttributes<M>>): Promise<M> {
        const record = await this.model.findByPk(id);

        if(!record) {
            throw new NotFoundError(`Record with id: ${id} not found`);
        }

        record.set(data);
        await record.save();

        return record;
    }

    async delete(whereOptions: WhereOptions<InferAttributes<M>>): Promise<void> {
        const record = await this.model.destroy({
            where: whereOptions
        });

        if(!record) {
            throw new NotFoundError(`Record not found for deletion with options: ${JSON.stringify(whereOptions)}`);
        }

        return;
    }
}

export default BaseRepository;