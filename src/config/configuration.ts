import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  database: {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    synchronize: true,
    logging: true,
    dropSchema: false,
    entities: ['dist/**/*.entity{.ts,.js}'],
  },
  jwtSecret: process.env.JWT_SECRET,
  mailer: {
    transport: {
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      // logger: true,
      // preview: true,
      // debug: true,
      // ignoreTLS: true,
      auth: {
        user: process.env.EMAIL_ID || 'yadira.terry48@ethereal.email',
        pass: process.env.EMAIL_PASS || '7mS2BRAywRjWTRJ1TM',
      },
    },
    defaults: {
      from: '"Fred Foo 👻" <foo@example.com>',
    },
    template: {
      dir: process.cwd() + '/templates',
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  },
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});
