import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerConfig implements MailerOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMailerOptions(): Promise<MailerOptions> {
    return this.configService.get('mailer');
  }
}
