import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUserNameColumn1752711132420 implements MigrationInterface {
    name = 'RemoveUserNameColumn1752711132420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_da5934070b5f2726ebfd3122c80"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "userName"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "userName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_da5934070b5f2726ebfd3122c80" UNIQUE ("userName")`);
    }

}
