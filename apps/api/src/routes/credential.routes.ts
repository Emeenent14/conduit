import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as credentialsService from '../services/credentials.service';
import * as credentialValidators from '../services/credential-validators';
import { logger } from '../lib/logger';

const router = Router();

// All credential routes require authentication
router.use(authenticate);

// ============================================
// Credential CRUD Routes
// ============================================

// GET /credentials - List user credentials
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const credentials = await credentialsService.listUserCredentials(userId);

    res.json({
      success: true,
      data: credentials,
    });
  } catch (error) {
    next(error);
  }
});

// POST /credentials - Create credential (API key)
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { appSlug, apiKey, name } = req.body;

    if (!appSlug || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: appSlug, apiKey',
      });
    }

    const credential = await credentialsService.createApiKeyCredential({
      userId,
      appSlug,
      apiKey,
      name,
    });

    logger.info('API key credential created', { userId, appSlug });

    res.status(201).json({
      success: true,
      data: credential,
    });
  } catch (error: any) {
    logger.error('Failed to create credential', { error: error.message });
    next(error);
  }
});

// GET /credentials/:id - Get credential
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const credential = await credentialsService.getCredentialById(id, userId);

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found',
      });
    }

    res.json({
      success: true,
      data: credential,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /credentials/:id - Delete credential
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await credentialsService.deleteCredential(id, userId);

    logger.info('Credential deleted', { userId, credentialId: id });

    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error: any) {
    if (error.message === 'Credential not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
});

// POST /credentials/:id/test - Test credential
router.post('/:id/test', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Get the credential
    const credential = await credentialsService.getCredentialById(id, userId);

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found',
      });
    }

    // Get the decrypted access token or API key
    const token = await credentialsService.getDecryptedAccessToken(id);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No credentials found to test',
      });
    }

    // Validate the credential
    const result = await credentialValidators.validateCredential(
      credential.app.slug,
      token
    );

    // Update credential status
    if (result.isValid) {
      await credentialsService.markCredentialValid(id);
    } else {
      await credentialsService.markCredentialInvalid(id, result.message || 'Validation failed');
    }

    logger.info('Credential tested', {
      userId,
      credentialId: id,
      appSlug: credential.app.slug,
      isValid: result.isValid,
    });

    res.json({
      success: true,
      data: {
        isValid: result.isValid,
        message: result.message,
        details: result.details,
      },
    });
  } catch (error: any) {
    logger.error('Credential test failed', { error: error.message });
    next(error);
  }
});

export default router;
