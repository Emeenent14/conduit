import { Router, Request } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as workflowService from '../services/workflow.service';
import { logger } from '../lib/logger';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

import * as executionService from '../services/execution.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /workflows/:id/executions - Get executions for a workflow
router.get('/:id/executions', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { id } = req.params;

    // Verify ownership
    const workflow = await workflowService.getWorkflowById(id, userId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    // Sync and get
    const executions = await executionService.syncWorkflowExecutions(id);

    res.json({
      success: true,
      data: executions
    });
  } catch (error) {
    next(error);
  }
});

// GET /workflows - Get all workflows for user
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const workflows = await workflowService.listUserWorkflows(userId);

    res.json({
      success: true,
      data: workflows,
    });
  } catch (error) {
    next(error);
  }
});

// GET /workflows/:id - Get workflow details
router.get('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { id } = req.params;

    const workflow = await workflowService.getWorkflowById(id, userId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    next(error);
  }
});

// POST /workflows - Create workflow from template
router.post('/', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { templateId, name, description, configValues, credentialMappings } = req.body;

    if (!templateId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: templateId, name',
      });
    }

    const workflow = await workflowService.createWorkflow({
      userId,
      templateId,
      name,
      description,
      configValues,
      credentialMappings: credentialMappings || [],
    });

    logger.info('Created workflow', { userId, workflowId: workflow.id, templateId });

    res.status(201).json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    logger.error('Failed to create workflow', { error });
    next(error);
  }
});

// PATCH /workflows/:id - Update workflow (TODO: Implement update logic in service if needed)
router.patch('/:id', async (req, res, next) => {
  // For now, we only typically update status via activate/deactivate
  // This could be used for renaming or updating config values later.
  res.status(501).json({ success: false, message: 'Not implemented' });
});

// DELETE /workflows/:id - Delete workflow
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { id } = req.params;

    await workflowService.deleteWorkflow(id, userId);

    logger.info('Deleted workflow', { userId, workflowId: id });

    res.json({
      success: true,
      data: { message: 'Workflow deleted' },
    });
  } catch (error: any) {
    if (error.message === 'Workflow not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
});

// POST /workflows/:id/activate - Activate workflow
router.post('/:id/activate', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { id } = req.params;

    const workflow = await workflowService.activateWorkflow(id, userId);

    logger.info('Activated workflow', { userId, workflowId: id });

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error: any) {
    next(error);
  }
});

// POST /workflows/:id/deactivate - Deactivate workflow
router.post('/:id/deactivate', async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user!.id;
    const { id } = req.params;

    const workflow = await workflowService.deactivateWorkflow(id, userId);

    logger.info('Deactivated workflow', { userId, workflowId: id });

    res.json({
      success: true,
      data: workflow,
    });
  } catch (error: any) {
    next(error);
  }
});

// POST /workflows/:id/test - Test execute workflow
router.post('/:id/test', async (req, res, next) => {
  // TODO: Connect to n8n manual execution
  res.status(501).json({ success: false, message: 'Not implemented' });
});

export default router;
