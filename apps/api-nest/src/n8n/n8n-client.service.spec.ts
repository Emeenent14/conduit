import axios from 'axios';
import { N8nClientService } from './n8n-client.service';

jest.mock('axios');

describe(N8nClientService, () => {
  let mockAxiosInstance: any;
  let service: N8nClientService;
  let mockConfig: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
    };

    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    mockConfig = {
      n8n: {
        apiUrl: 'http://n8n.test',
        apiKey: 'k',
      },
    };

    service = new N8nClientService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates an axios instance with the configured baseURL, headers, and timeout', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://n8n.test',
        headers: {
          'X-N8N-API-KEY': 'k',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    });

    it('registers a response interceptor', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  describe('createWorkflow', () => {
    it('POSTs to /workflows with the workflow body and unwraps the id', async () => {
      const workflow: any = { name: 'wf', nodes: [], connections: {} };
      mockAxiosInstance.post.mockResolvedValue({ data: { id: 'wf-1' } });

      const result = await service.createWorkflow(workflow);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/workflows',
        workflow,
      );
      expect(result).toEqual({ id: 'wf-1' });
    });
  });

  describe('getWorkflow', () => {
    it('GETs /workflows/:id and returns response.data wholesale', async () => {
      const workflowData = {
        id: 'wf-1',
        name: 'wf',
        nodes: [],
        connections: {},
      };
      mockAxiosInstance.get.mockResolvedValue({ data: workflowData });

      const result = await service.getWorkflow('wf-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workflows/wf-1');
      expect(result).toEqual(workflowData);
    });
  });

  describe('updateWorkflow', () => {
    it('PUTs to /workflows/:id with the partial workflow body', async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} });

      await service.updateWorkflow('wf-1', { name: 'renamed' });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/workflows/wf-1', {
        name: 'renamed',
      });
    });
  });

  describe('deleteWorkflow', () => {
    it('DELETEs /workflows/:id', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await service.deleteWorkflow('wf-1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/workflows/wf-1');
    });
  });

  describe('activateWorkflow', () => {
    it('POSTs to /workflows/:id/activate', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      await service.activateWorkflow('wf-1');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/workflows/wf-1/activate',
      );
    });
  });

  describe('deactivateWorkflow', () => {
    it('POSTs to /workflows/:id/deactivate', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      await service.deactivateWorkflow('wf-1');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/workflows/wf-1/deactivate',
      );
    });
  });

  describe('executeWorkflow', () => {
    it('POSTs to /workflows/:id/execute with the provided data and returns response.data', async () => {
      const execution = { id: 'ex-1', finished: true };
      mockAxiosInstance.post.mockResolvedValue({ data: execution });

      const result = await service.executeWorkflow('wf-1', { foo: 'bar' });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/workflows/wf-1/execute',
        { data: { foo: 'bar' } },
      );
      expect(result).toEqual(execution);
    });

    it('defaults data to an empty object when omitted', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      await service.executeWorkflow('wf-1');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/workflows/wf-1/execute',
        { data: {} },
      );
    });
  });

  describe('listWorkflows', () => {
    it('GETs /workflows and returns response.data.data', async () => {
      const workflows = [{ id: 'wf-1' }, { id: 'wf-2' }];
      mockAxiosInstance.get.mockResolvedValue({ data: { data: workflows } });

      const result = await service.listWorkflows();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workflows');
      expect(result).toEqual(workflows);
    });

    it('defaults to an empty array when response.data.data is missing', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      const result = await service.listWorkflows();

      expect(result).toEqual([]);
    });
  });

  describe('createCredential', () => {
    it('POSTs to /credentials with the credential body and unwraps the id', async () => {
      const credential: any = { name: 'cred', type: 'openAiApi', data: {} };
      mockAxiosInstance.post.mockResolvedValue({ data: { id: 'cred-1' } });

      const result = await service.createCredential(credential);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/credentials',
        credential,
      );
      expect(result).toEqual({ id: 'cred-1' });
    });
  });

  describe('deleteCredential', () => {
    it('DELETEs /credentials/:id', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await service.deleteCredential('cred-1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/credentials/cred-1',
      );
    });
  });

  describe('listCredentials', () => {
    it('GETs /credentials and returns response.data.data', async () => {
      const credentials = [{ id: 'cred-1' }, { id: 'cred-2' }];
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: credentials },
      });

      const result = await service.listCredentials();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/credentials');
      expect(result).toEqual(credentials);
    });

    it('defaults to an empty array when response.data.data is missing', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      const result = await service.listCredentials();

      expect(result).toEqual([]);
    });
  });

  describe('getExecutions', () => {
    it('GETs /executions with a limit param and returns response.data.data', async () => {
      const executions = [{ id: 'ex-1' }];
      mockAxiosInstance.get.mockResolvedValue({ data: { data: executions } });

      const result = await service.getExecutions();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/executions', {
        params: { limit: 20 },
      });
      expect(result).toEqual(executions);
    });

    it('includes workflowId in params when provided, and respects a custom limit', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { data: [] } });

      await service.getExecutions('wf-1', 5);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/executions', {
        params: { limit: 5, workflowId: 'wf-1' },
      });
    });

    it('defaults to an empty array when response.data.data is missing', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      const result = await service.getExecutions();

      expect(result).toEqual([]);
    });
  });

  describe('getExecution', () => {
    it('GETs /executions/:id and returns response.data wholesale', async () => {
      const executionDetail = { id: 'ex-1', workflowData: {} };
      mockAxiosInstance.get.mockResolvedValue({ data: executionDetail });

      const result = await service.getExecution('ex-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/executions/ex-1');
      expect(result).toEqual(executionDetail);
    });
  });

  describe('deleteExecution', () => {
    it('DELETEs /executions/:id', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await service.deleteExecution('ex-1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/executions/ex-1');
    });
  });

  describe('healthCheck', () => {
    it('returns true when the underlying request succeeds', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { data: [] } });

      const result = await service.healthCheck();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workflows', {
        params: { limit: 1 },
      });
      expect(result).toBe(true);
    });

    it('returns false when the underlying request rejects', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('network down'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('handleError (via response interceptor)', () => {
    function getOnRejected(): (error: any) => any {
      return mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    }

    it('maps a 401 response to an authentication-failed error', () => {
      const onRejected = getOnRejected();
      const error = { response: { status: 401, data: {} } };

      expect(() => onRejected(error)).toThrow(
        'n8n authentication failed. Check API key.',
      );
    });

    it('maps a 404 response to a resource-not-found error', () => {
      const onRejected = getOnRejected();
      const error = { response: { status: 404, data: {} } };

      expect(() => onRejected(error)).toThrow('n8n resource not found.');
    });

    it('maps a >=500 response to a server error', () => {
      const onRejected = getOnRejected();
      const error = { response: { status: 503, data: {} } };

      expect(() => onRejected(error)).toThrow(
        'n8n server error. Please try again.',
      );
    });

    it('maps another status with a response body message to n8n error: <message>', () => {
      const onRejected = getOnRejected();
      const error = {
        response: { status: 400, data: { message: 'bad input' } },
      };

      expect(() => onRejected(error)).toThrow('n8n error: bad input');
    });

    it('maps a missing response with ECONNREFUSED to a connection error', () => {
      const onRejected = getOnRejected();
      const error = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED' };

      expect(() => onRejected(error)).toThrow(
        'Cannot connect to n8n. Is it running?',
      );
    });

    it('maps a missing response with no matching code to a generic request-failed error', () => {
      const onRejected = getOnRejected();
      const error = {
        code: 'ETIMEDOUT',
        message: 'timeout of 30000ms exceeded',
      };

      expect(() => onRejected(error)).toThrow(
        'n8n request failed: timeout of 30000ms exceeded',
      );
    });
  });
});
