import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserTable1700187213354 implements MigrationInterface {
    name = 'UserTable1700187213354';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "user" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "userName" character varying NOT NULL, "email" character varying NOT NULL, "hashedPassword" text, "isOauth" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "joinedDate" TIMESTAMP NOT NULL DEFAULT now(), "bio" character varying, CONSTRAINT "UQ_da5934070b5f2726ebfd3122c80" UNIQUE ("userName"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
    }
}
