import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { ExecutionsService } from '../executions/executions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { ApiException } from '../common/exceptions/api.exception';

/**
 * Port of routes/workflow.routes.ts.
 *
 * Note: the Express version mixed raw `{ success:false, message }` bodies
 * (credential/workflow 404s) with the ApiError `{ success:false, error:{
 * code, message } }` envelope (templates, auth). This port normalizes all
 * error responses to the ApiException envelope via the global filter --
 * confirm apps/web tolerates that shape during Phase 5 parity testing.
 */
@Controller('v1/workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  private readonly logger = new Logger(WorkflowsController.name);

  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly executionsService: ExecutionsService,
  ) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    const data = await this.workflowsService.listUserWorkflows(user.id);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const workflow = await this.workflowsService.getWorkflowById(id, user.id);
    if (!workflow) {
      throw ApiException.notFound('Workflow');
    }
    return { success: true, data: workflow };
  }

  @Get(':id/executions')
  async executions(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const workflow = await this.workflowsService.getWorkflowById(id, user.id);
    if (!workflow) {
      throw ApiException.notFound('Workflow');
    }

    const data = await this.executionsService.syncWorkflowExecutions(id);
    return { success: true, data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: RequestUser,
    @Body()
    body: {
      templateId?: string;
      name?: string;
      description?: string;
      configValues?: Record<string, any>;
      credentialMappings?: Array<{ appSlug: string; credentialId: string }>;
    },
  ) {
    const { templateId, name, description, configValues, credentialMappings } =
      body;

    if (!templateId || !name) {
      throw ApiException.badRequest(
        'Missing required fields: templateId, name',
      );
    }

    const workflow = await this.workflowsService.createWorkflow({
      userId: user.id,
      templateId,
      name,
      description,
      configValues,
      credentialMappings: credentialMappings || [],
    });

    this.logger.log(
      `Created workflow ${workflow.id} for user ${user.id} (template ${templateId})`,
    );

    return { success: true, data: workflow };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  update() {
    return { success: false, message: 'Not implemented' };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    try {
      await this.workflowsService.deleteWorkflow(id, user.id);
    } catch (error: any) {
      if (error.message === 'Workflow not found') {
        throw ApiException.notFound('Workflow');
      }
      throw error;
    }

    this.logger.log(`Deleted workflow ${id} for user ${user.id}`);
    return { success: true, data: { message: 'Workflow deleted' } };
  }

  @Post(':id/activate')
  async activate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const workflow = await this.workflowsService.activateWorkflow(id, user.id);
    this.logger.log(`Activated workflow ${id} for user ${user.id}`);
    return { success: true, data: workflow };
  }

  @Post(':id/deactivate')
  async deactivate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const workflow = await this.workflowsService.deactivateWorkflow(
      id,
      user.id,
    );
    this.logger.log(`Deactivated workflow ${id} for user ${user.id}`);
    return { success: true, data: workflow };
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  test() {
    return { success: false, message: 'Not implemented' };
  }
}
