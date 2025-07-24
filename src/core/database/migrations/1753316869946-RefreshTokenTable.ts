import { MigrationInterface, QueryRunner } from "typeorm";

export class RefreshTokenTable1753316869946 implements MigrationInterface {
    name = 'RefreshTokenTable1753316869946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_token" ("id" SERIAL NOT NULL, "token" text NOT NULL, "userId" integer NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "isRevoked" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isOauth" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isActive" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "joinedDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "refresh_token" ADD CONSTRAINT "FK_8e913e288156c133999341156ad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_8e913e288156c133999341156ad"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "joinedDate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isActive" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isOauth" SET NOT NULL`);
        await queryRunner.query(`DROP TABLE "refresh_token"`);
    }

}
