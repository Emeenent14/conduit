import { Global, Module } from '@nestjs/common';
import { N8nClientService } from './n8n-client.service';
import { N8nCredentialService } from './n8n-credential.service';

@Global()
@Module({
  providers: [N8nClientService, N8nCredentialService],
  exports: [N8nClientService, N8nCredentialService],
})
export class N8nModule {}
