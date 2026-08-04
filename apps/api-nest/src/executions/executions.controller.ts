import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Port of routes/execution.routes.ts. Both endpoints are still TODO stubs
 * in the Express app ("Implement in Phase 5") -- ported as-is for parity.
 * The real sync logic lives in ExecutionsService, used today only via
 * WorkflowsController's `/workflows/:id/executions` route.
 */
@Controller('v1/executions')
@UseGuards(JwtAuthGuard)
export class ExecutionsController {
  @Get()
  list() {
    return { success: true, data: { executions: [] } };
  }

  @Get(':id')
  findOne(@Param('id') _id: string) {
    return { success: true, data: { execution: null } };
  }
}
