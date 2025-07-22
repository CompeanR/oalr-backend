import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserBioType1751077900595 implements MigrationInterface {
    name = 'UpdateUserBioType1751077900595';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bio" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bio" character varying`);
    }
}
